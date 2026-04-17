// ---- Env binding ----

export interface Env {
  RESUME_KV: KVNamespace;
}

// ---- Response helpers ----

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function ok<T>(data: T): Response {
  return json({ success: true, data });
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
}

interface AppSettings {
  auth: AuthSettings;
  translation: { deeplApiKey: string };
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

async function verifyJwt(token: string, authority: string, clientId: string): Promise<boolean> {
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  let header: JwtHeader;
  let claims: JwtClaims;
  try {
    header = jsonDecode(parts[0]) as JwtHeader;
    claims = jsonDecode(parts[1]) as JwtClaims;
  } catch {
    return false;
  }

  // Expiry check
  const now = Math.floor(Date.now() / 1000);
  if (claims.exp !== undefined && claims.exp < now) return false;

  // Issuer check — normalize both sides (strip trailing slashes)
  if (claims.iss) {
    const tokenIss = claims.iss.replace(/\/$/, '');
    const expectedIss = authority.replace(/\/$/, '');
    if (tokenIss !== expectedIss) return false;
  }

  // Audience check — we validate using id_token (aud = clientId per OIDC spec).
  if (claims.aud !== undefined) {
    const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!aud.includes(clientId)) return false;
  }

  // Fetch JWKS via discovery
  const base = authority.replace(/\/$/, '');
  const discoveryRes = await fetch(`${base}/.well-known/openid-configuration`);
  if (!discoveryRes.ok) return false;
  const oidcConfig = (await discoveryRes.json()) as OidcConfig;

  const jwksRes = await fetch(oidcConfig.jwks_uri);
  if (!jwksRes.ok) return false;
  const jwks = (await jwksRes.json()) as { keys: JwkKey[] };

  const signingKey = header.kid
    ? jwks.keys.find((k) => k.kid === header.kid)
    : jwks.keys.find((k) => !k.use || k.use === 'sig');
  if (!signingKey) return false;

  const alg = header.alg;
  let cryptoKey: CryptoKey;
  try {
    cryptoKey = await importSigningKey(signingKey, alg);
  } catch {
    return false;
  }

  const signatureInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const signature = base64UrlDecodeToBuffer(parts[2]);

  try {
    if (alg.startsWith('RS')) {
      return await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, signature, signatureInput);
    }
    if (alg.startsWith('ES')) {
      const hash = alg === 'ES256' ? 'SHA-256' : 'SHA-384';
      return await crypto.subtle.verify({ name: 'ECDSA', hash }, cryptoKey, signature, signatureInput);
    }
  } catch {
    return false;
  }
  return false;
}

export async function authGuard(request: Request, env: Env): Promise<Response | null> {
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
    const valid = await verifyJwt(token, settings.auth.authority, settings.auth.clientId);
    if (!valid) return err('Invalid or expired token', 401);
  } catch {
    // Any unexpected error during validation → deny access (fail closed)
    return err('Token validation failed', 401);
  }

  return null; // authorized
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
