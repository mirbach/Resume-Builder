import type { AuthSettings } from './types';

// ---- PKCE helpers ----

function base64UrlEncode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function generateCodeVerifier(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes.buffer);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(digest);
}

// ---- OIDC discovery ----

interface OidcDiscovery {
  authorization_endpoint: string;
  token_endpoint: string;
  end_session_endpoint?: string;
}

async function discoverEndpoints(authority: string): Promise<OidcDiscovery> {
  const base = authority.replace(/\/$/, '');
  const res = await fetch(`${base}/.well-known/openid-configuration`);
  if (!res.ok) throw new Error('Failed to fetch OIDC discovery document');
  return res.json() as Promise<OidcDiscovery>;
}

// ---- Auth flow ----

const STATE_KEY = 'oidc_state';
const VERIFIER_KEY = 'pkce_verifier';
const TOKEN_KEY = 'auth_token';
const ID_TOKEN_KEY = 'auth_id_token';

export async function buildAuthUrl(auth: AuthSettings): Promise<string> {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  const state = crypto.randomUUID();

  sessionStorage.setItem(VERIFIER_KEY, verifier);
  sessionStorage.setItem(STATE_KEY, state);

  const { authorization_endpoint } = await discoverEndpoints(auth.authority);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: auth.clientId,
    redirect_uri: auth.redirectUri,
    scope: auth.scopes.join(' '),
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  return `${authorization_endpoint}?${params}`;
}

export async function exchangeCodeForToken(
  code: string,
  auth: AuthSettings,
): Promise<{ accessToken: string; idToken?: string }> {
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  if (!verifier) throw new Error('No PKCE verifier in session — please try signing in again');

  const { token_endpoint } = await discoverEndpoints(auth.authority);

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: auth.clientId,
    code,
    redirect_uri: auth.redirectUri,
    code_verifier: verifier,
  });

  const res = await fetch(token_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Token exchange failed${detail ? ': ' + detail : ''}`);
  }

  const data = (await res.json()) as { access_token: string; id_token?: string };
  return { accessToken: data.access_token, idToken: data.id_token };
}

export function storeToken(accessToken: string, idToken?: string) {
  sessionStorage.setItem(TOKEN_KEY, accessToken);
  if (idToken) sessionStorage.setItem(ID_TOKEN_KEY, idToken);
}

export function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getStoredIdToken(): string | null {
  return sessionStorage.getItem(ID_TOKEN_KEY);
}

/**
 * Returns the token to use as a Bearer credential for our own API.
 * Prefers id_token (always a JWT, aud = clientId) over access_token
 * (which may be opaque/non-JWT depending on the provider).
 */
export function getApiToken(): string | null {
  return sessionStorage.getItem(ID_TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(ID_TOKEN_KEY);
  sessionStorage.removeItem(VERIFIER_KEY);
  sessionStorage.removeItem(STATE_KEY);
}

/**
 * Decode the JWT payload (no signature check — client-side only) and return
 * true if the token's `exp` claim is in the past or the token is unparseable.
 */
export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
    if (typeof payload.exp !== 'number') return false; // no exp claim → treat as valid
    return Date.now() / 1000 >= payload.exp;
  } catch {
    return true;
  }
}

export function validateOAuthState(returned: string | null): boolean {
  const stored = sessionStorage.getItem(STATE_KEY);
  if (!stored || stored !== returned) return false;
  // Consume nonce immediately — prevents reuse within the same session
  sessionStorage.removeItem(STATE_KEY);
  return true;
}

// ---- RP-initiated logout ----

export async function buildLogoutUrl(auth: AuthSettings): Promise<string | null> {
  try {
    const { end_session_endpoint } = await discoverEndpoints(auth.authority);
    if (!end_session_endpoint) return null;

    const idToken = getStoredIdToken();
    const params = new URLSearchParams({
      client_id: auth.clientId,
      post_logout_redirect_uri: auth.redirectUri,
    });
    if (idToken) params.set('id_token_hint', idToken);

    return `${end_session_endpoint}?${params}`;
  } catch {
    return null;
  }
}
