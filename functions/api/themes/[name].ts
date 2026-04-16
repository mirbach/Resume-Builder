import { type Env, ok, err, authGuard, sanitizeFilename, DEFAULT_THEME } from '../../_shared/helpers';

// GET /api/themes/:name — public (no auth required to view)
export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const raw_name = Array.isArray(params.name) ? params.name[0] : params.name;
  const name = sanitizeFilename(raw_name);

  try {
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

// PUT /api/themes/:name
export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const denied = await authGuard(request, env);
  if (denied) return denied;

  const raw_name = Array.isArray(params.name) ? params.name[0] : params.name;
  const name = sanitizeFilename(raw_name);

  try {
    const theme = await request.json();
    await env.RESUME_KV.put(`theme:${name}`, JSON.stringify(theme));
    return ok(theme);
  } catch {
    return err('Failed to update theme');
  }
};

// DELETE /api/themes/:name
export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const denied = await authGuard(request, env);
  if (denied) return denied;

  const raw_name = Array.isArray(params.name) ? params.name[0] : params.name;
  const name = sanitizeFilename(raw_name);

  if (name === 'default') return err('Cannot delete the default theme', 400);

  try {
    await env.RESUME_KV.delete(`theme:${name}`);
    return ok(null);
  } catch {
    return err('Failed to delete theme');
  }
};
