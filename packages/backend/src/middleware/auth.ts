import { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify, errors as joseErrors } from 'jose';
import { readJson } from '../lib/storage.js';
import type { AppSettings } from '../types.js';

// Cache JWKS fetchers keyed by JWKS URI so we don't re-fetch on every request.
// jose's createRemoteJWKSet already caches the key material internally.
const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getJwks(jwksUri: string) {
  if (!jwksCache.has(jwksUri)) {
    jwksCache.set(jwksUri, createRemoteJWKSet(new URL(jwksUri)));
  }
  return jwksCache.get(jwksUri)!;
}

// Private/loopback IP ranges that must not be contacted via SSRF (A10)
const PRIVATE_IP_RE =
  /^(localhost|127\.|0\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|::1|fc00:|fe80:)/i;

/**
 * Validate that an OIDC authority URL is safe to fetch (A10: SSRF prevention).
 * Rejects non-HTTPS URLs and private / loopback addresses.
 */
function assertSafeAuthority(authority: string): void {
  let parsed: URL;
  try {
    parsed = new URL(authority);
  } catch {
    throw new Error('Invalid authority URL');
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('Authority must use HTTPS');
  }
  if (PRIVATE_IP_RE.test(parsed.hostname)) {
    throw new Error('Authority must not point to a private or loopback address');
  }
}

/**
 * Resolve the JWKS URI from the OIDC authority.
 * Tries the standard /.well-known/openid-configuration discovery endpoint first,
 * falls back to appending /keys (Entra ID v2 shortcut).
 */
async function resolveJwksUri(authority: string): Promise<string> {
  assertSafeAuthority(authority);
  const base = authority.replace(/\/$/, '');
  const discoveryUrl = `${base}/.well-known/openid-configuration`;

  const res = await fetch(discoveryUrl);
  if (res.ok) {
    const config = await res.json() as { jwks_uri?: string };
    if (typeof config.jwks_uri === 'string') {
      // Validate the returned JWKS URI as well (A10: open-redirect via discovery doc)
      assertSafeAuthority(config.jwks_uri);
      return config.jwks_uri;
    }
  }

  // Fallback — used by some providers that don't serve discovery docs
  return `${base}/keys`;
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await readJson<AppSettings>('settings.json').catch(() => null);

    // If settings missing or auth disabled, allow through
    if (!settings?.auth?.enabled) {
      next();
      return;
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.slice(7);
    if (!token) {
      res.status(401).json({ success: false, error: 'Empty token' });
      return;
    }

    const { authority, clientId } = settings.auth;
    if (!authority) {
      res.status(500).json({ success: false, error: 'Auth is enabled but authority is not configured' });
      return;
    }

    // assertSafeAuthority is called inside resolveJwksUri — this will throw
    // with a plain Error for invalid authority, which is caught below.
    const jwksUri = await resolveJwksUri(authority);
    const JWKS = getJwks(jwksUri);

    await jwtVerify(token, JWKS, {
      issuer: authority.replace(/\/$/, ''),
      // Validate audience only when clientId is set (some providers omit it)
      ...(clientId ? { audience: clientId } : {}),
    });

    next();
  } catch (err) {
    if (err instanceof joseErrors.JWTExpired) {
      res.status(401).json({ success: false, error: 'Token expired' });
    } else if (
      err instanceof joseErrors.JWTClaimValidationFailed ||
      err instanceof joseErrors.JWSSignatureVerificationFailed ||
      err instanceof joseErrors.JWSInvalid ||
      err instanceof joseErrors.JWTInvalid
    ) {
      res.status(401).json({ success: false, error: 'Invalid token' });
    } else {
      // Unexpected error (network, config) — log and reject rather than fail open
      console.error('[auth] Unexpected error during token validation:', err);
      res.status(500).json({ success: false, error: 'Token validation failed' });
    }
  }
}

