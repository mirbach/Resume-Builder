import { type Env, ok, err, authGuard, sanitizeFilename, DEFAULT_THEME } from '../../_shared/helpers';

// GET /api/themes/:name — checks user's theme first, then falls back to global
export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const guard = await authGuard(request, env);
  if (guard instanceof Response) return guard;

  const raw_name = Array.isArray(params.name) ? params.name[0] : params.name;
  const name = sanitizeFilename(raw_name);

  try {
    // Check user's personal theme first
    if (guard) {
      const userRaw = await env.RESUME_KV.get(`theme:${guard.userId}:${name}`);
      if (userRaw) return ok(JSON.parse(userRaw));
    }

    // Fall back to global theme
    let raw = await env.RESUME_KV.get(`theme:${name}`);

    // Auto-seed default theme on first access
    if (!raw && name === 'default') {
      await env.RESUME_KV.put('theme:default', JSON.stringify(DEFAULT_THEME));
      raw = JSON.stringify(DEFAULT_THEME);
    }

    if (!raw) return err('Theme not found', 404);
    return ok(JSON.parse(raw));
  } catch {
    return err('Failed to load theme');
  }
};

// PUT /api/themes/:name — admins write to global scope; users write to personal scope only
export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const guard = await authGuard(request, env);
  if (guard instanceof Response) return guard;

  const raw_name = Array.isArray(params.name) ? params.name[0] : params.name;
  const name = sanitizeFilename(raw_name);

  try {
    const theme = await request.json();
    let key: string;
    if (!guard) {
      // Auth disabled — single-user mode
      key = `theme:${name}`;
    } else if (guard.isAdmin) {
      key = `theme:${name}`;
    } else {
      // Regular user: block if targeting a global theme
      const isGlobal = !!(await env.RESUME_KV.get(`theme:${name}`));
      if (isGlobal) return err('Forbidden: only admins can edit company themes', 403);
      key = `theme:${guard.userId}:${name}`;
    }
    await env.RESUME_KV.put(key, JSON.stringify(theme));
    return ok(theme);
  } catch {
    return err('Failed to update theme');
  }
};

// DELETE /api/themes/:name — can only delete user's personal themes; global themes are protected
export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const guard = await authGuard(request, env);
  if (guard instanceof Response) return guard;

  const raw_name = Array.isArray(params.name) ? params.name[0] : params.name;
  const name = sanitizeFilename(raw_name);

  if (!guard && name === 'default') return err('Cannot delete the default theme', 400);

  try {
    if (guard?.isAdmin) {
      // Admins can delete global themes (except the built-in default)
      if (name === 'default') return err('Cannot delete the default theme', 400);
      await env.RESUME_KV.delete(`theme:${name}`);
    } else if (guard) {
      const userKey = `theme:${guard.userId}:${name}`;
      const existing = await env.RESUME_KV.get(userKey);
      if (!existing) {
        // Check if it's a global theme — regular users cannot delete those
        const globalExists = await env.RESUME_KV.get(`theme:${name}`);
        if (globalExists) return err('Cannot delete a company theme', 403);
        return err('Theme not found', 404);
      }
      await env.RESUME_KV.delete(userKey);
    } else {
      await env.RESUME_KV.delete(`theme:${name}`);
    }
    return ok(null);
  } catch {
    return err('Failed to delete theme');
  }
};
