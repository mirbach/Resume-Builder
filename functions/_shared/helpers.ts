// ---- Env binding ----

export interface Env {
  RESUME_KV: KVNamespace;
  /** OIDC sub claim of the administrator. When set, only this user may modify settings. */
  ADMIN_SUB?: string;
}

// ---- Response helpers ----

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function ok<T>(data: T, keysConfigured?: Record<string, boolean>): Response {
  return json({ success: true, data, ...(keysConfigured ? { keysConfigured } : {}) });
}

export function err(message: string, status = 500): Response {
  return json({ success: false, error: message }, status);
}

// ---- Sanitize filenames (same logic as backend) ----

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '');
}

// ---- Auth guard ----

interface AuthSettings {
  enabled: boolean;
  provider: string;
  clientId: string;
  authority: string;
  redirectUri: string;
  scopes: string[];
  adminRoleClaim?: string;
  adminRoleValue?: string;
}

interface AppSettings {
  auth: AuthSettings;
  translation: { deeplApiKey: string };
  ai: { provider: string; apiKey: string; model: string };
}

// ---- SSRF prevention ----

const PRIVATE_IP_RE =
  /^(localhost|127\.|0\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|::1|fc00:|fe80:)/i;

function assertSafeUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Invalid URL');
  }
  if (parsed.protocol !== 'https:') throw new Error('URL must use HTTPS');
  if (PRIVATE_IP_RE.test(parsed.hostname)) throw new Error('URL must not point to a private or loopback address');
}

// ---- JWT / JWKS verification (Web Crypto API — Cloudflare Workers compatible) ----

interface JwkKey {
  kty: string;
  kid?: string;
  use?: string;
  alg?: string;
  // RSA fields
  n?: string;
  e?: string;
  // EC fields
  crv?: string;
  x?: string;
  y?: string;
}

interface OidcConfig {
  jwks_uri: string;
}

interface JwtHeader {
  alg: string;
  kid?: string;
}

interface JwtClaims {
  iss?: string;
  aud?: string | string[];
  exp?: number;
  sub?: string;
}

function base64UrlDecodeToBuffer(str: string): ArrayBuffer {
  // Pad to a multiple of 4, then decode
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = (4 - (padded.length % 4)) % 4;
  const binary = atob(padded + '='.repeat(pad));
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf.buffer;
}

function jsonDecode(b64url: string): unknown {
  return JSON.parse(new TextDecoder().decode(base64UrlDecodeToBuffer(b64url)));
}

async function importSigningKey(key: JwkKey, alg: string): Promise<CryptoKey> {
  if (alg === 'RS256' || alg === 'RS384' || alg === 'RS512') {
    const hash = alg === 'RS256' ? 'SHA-256' : alg === 'RS384' ? 'SHA-384' : 'SHA-512';
    return crypto.subtle.importKey('jwk', key as JsonWebKey, { name: 'RSASSA-PKCS1-v1_5', hash }, false, ['verify']);
  }
  if (alg === 'ES256') {
    return crypto.subtle.importKey('jwk', key as JsonWebKey, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  }
  if (alg === 'ES384') {
    return crypto.subtle.importKey('jwk', key as JsonWebKey, { name: 'ECDSA', namedCurve: 'P-384' }, false, ['verify']);
  }
  throw new Error(`Unsupported JWT algorithm: ${alg}`);
}

/**
 * Verify a JWT and return the sub claim on success, or null if invalid.
 * Uses Web Crypto API (Cloudflare Workers compatible).
 */
async function verifyJwt(token: string, authority: string, clientId: string): Promise<string | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  let header: JwtHeader;
  let claims: JwtClaims;
  try {
    header = jsonDecode(parts[0]) as JwtHeader;
    claims = jsonDecode(parts[1]) as JwtClaims;
  } catch {
    return null;
  }

  // Expiry check
  const now = Math.floor(Date.now() / 1000);
  if (claims.exp !== undefined && claims.exp < now) return null;

  // Issuer check — iss is required; reject tokens that omit it (RFC 7519 §4.1.1)
  const tokenIss = (claims.iss ?? '').replace(/\/$/, '');
  const expectedIss = authority.replace(/\/$/, '');
  if (!tokenIss || tokenIss !== expectedIss) return null;

  // Audience check — we validate using id_token (aud = clientId per OIDC spec).
  if (claims.aud !== undefined) {
    const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!aud.includes(clientId)) return null;
  }

  // Fetch JWKS via discovery — validate authority and jwks_uri to prevent SSRF
  const base = authority.replace(/\/$/, '');
  try {
    assertSafeUrl(base);
  } catch {
    return null;
  }
  const discoveryRes = await fetch(`${base}/.well-known/openid-configuration`);
  if (!discoveryRes.ok) return null;
  const oidcConfig = (await discoveryRes.json()) as OidcConfig;

  try {
    assertSafeUrl(oidcConfig.jwks_uri);
  } catch {
    return null;
  }
  const jwksRes = await fetch(oidcConfig.jwks_uri);
  if (!jwksRes.ok) return null;
  const jwks = (await jwksRes.json()) as { keys: JwkKey[] };

  const signingKey = header.kid
    ? jwks.keys.find((k) => k.kid === header.kid)
    : jwks.keys.find((k) => !k.use || k.use === 'sig');
  if (!signingKey) return null;

  const alg = header.alg;
  let cryptoKey: CryptoKey;
  try {
    cryptoKey = await importSigningKey(signingKey, alg);
  } catch {
    return null;
  }

  const signatureInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const signature = base64UrlDecodeToBuffer(parts[2]);

  let valid = false;
  try {
    if (alg.startsWith('RS')) {
      valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, signature, signatureInput);
    } else if (alg.startsWith('ES')) {
      const hash = alg === 'ES256' ? 'SHA-256' : 'SHA-384';
      valid = await crypto.subtle.verify({ name: 'ECDSA', hash }, cryptoKey, signature, signatureInput);
    }
  } catch {
    return null;
  }

  return valid ? (claims.sub ?? '') : null;
}

/**
 * Decode the JWT payload (no signature check) and return the raw sub claim.
 * Only call this after the token has already been verified by authGuard.
 */
export function getSubFromToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const claims = jsonDecode(parts[1]) as JwtClaims;
    return claims.sub ?? null;
  } catch {
    return null;
  }
}

/**
 * Deterministically map a sub claim to a KV-safe userId string.
 * SHA-256 hex — same algorithm as the Express backend's subToUserId().
 */
async function subToUserId(sub: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sub));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export interface AuthContext {
  userId: string;
  isAdmin: boolean;
}

/**
 * Auth guard for Cloudflare Workers route handlers.
 *
 * Returns:
 *   - A Response (4xx/5xx) if the request is denied — callers must return it immediately.
 *   - An AuthContext { userId, isAdmin } when auth is enabled and the token is valid.
 *   - null when auth is disabled (single-user / initial-setup mode).
 */
export async function authGuard(request: Request, env: Env): Promise<Response | AuthContext | null> {
  let settings: AppSettings;
  try {
    const raw = await env.RESUME_KV.get('settings');
    if (!raw) return null; // no settings yet — allow (initial setup)
    settings = JSON.parse(raw) as AppSettings;
  } catch {
    return null; // can't parse settings — allow (initial setup / misconfiguration)
  }

  if (!settings.auth?.enabled) return null;

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return err('Missing or invalid authorization header', 401);
  }
  const token = authHeader.slice(7);
  if (!token) return err('Empty token', 401);

  // Validate JWT signature, expiry, issuer, and audience
  try {
    const sub = await verifyJwt(token, settings.auth.authority, settings.auth.clientId);
    if (!sub) return err('Invalid or expired token', 401);

    // Determine admin status via role claim or ADMIN_SUB bootstrap fallback.
    // The token has already been fully verified above — safe to read payload claims.
    let isAdmin = false;
    if (settings.auth.adminRoleClaim && settings.auth.adminRoleValue) {
      try {
        const parts = token.split('.');
        const payload = JSON.parse(new TextDecoder().decode(base64UrlDecodeToBuffer(parts[1]))) as Record<string, unknown>;
        const rawClaim = payload[settings.auth.adminRoleClaim];
        isAdmin = Array.isArray(rawClaim)
          ? rawClaim.includes(settings.auth.adminRoleValue)
          : rawClaim !== null && typeof rawClaim === 'object'
            ? Object.prototype.hasOwnProperty.call(rawClaim, settings.auth.adminRoleValue)
            : rawClaim === settings.auth.adminRoleValue;
      } catch { /* isAdmin stays false */ }
    }
    if (!isAdmin && env.ADMIN_SUB && sub === env.ADMIN_SUB) isAdmin = true;

    return { userId: await subToUserId(sub), isAdmin };
  } catch {
    // Any unexpected error during validation → deny access (fail closed)
    return err('Token validation failed', 401);
  }
}

// ---- Default data ----

export const DEFAULT_RESUME = {
  personal: {
    name: '',
    title: { en: '', de: '' },
    email: '',
    phone: '',
    location: { en: '', de: '' },
  },
  summary: { en: '', de: '' },
  experience: [],
  education: [],
  skills: [],
  certifications: [],
  languages: [],
  projects: [],
  products: [],
  references: [],
};

export const DEFAULT_SETTINGS: AppSettings = {
  auth: {
    enabled: false,
    provider: 'generic-oidc',
    clientId: '',
    authority: '',
    redirectUri: 'https://your-site.pages.dev',
    scopes: ['openid', 'profile', 'email'],
  },
  translation: { deeplApiKey: '' },
  ai: { provider: 'openai', apiKey: '', model: '' },
};

export const DEFAULT_THEME = {
  name: 'Default',
  colors: {
    primary: '#2563eb',
    secondary: '#6b7280',
    accent: '#059669',
    text: '#1f2937',
    background: '#ffffff',
    heading: '#111827',
  },
  fonts: { heading: 'Inter', body: 'Inter', size: 'medium' },
  layout: {
    style: 'single-column',
    headerStyle: 'full-width',
    sectionOrder: [
      'personal', 'summary', 'experience', 'education', 'skills',
      'certifications', 'languages', 'projects', 'products', 'references',
    ],
    showPhoto: true,
    pageMargins: { top: 40, right: 40, bottom: 40, left: 40 },
  },
};

// ---- Base64 helpers for KV image storage ----

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
