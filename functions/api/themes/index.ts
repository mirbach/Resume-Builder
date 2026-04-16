import { type Env, ok, err, authGuard, sanitizeFilename, DEFAULT_THEME } from '../../_shared/helpers';

// GET /api/themes — public (no auth required to view)
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    // Seed default theme if it doesn't exist yet
    const defaultKey = 'theme:default';
    const defaultRaw = await env.RESUME_KV.get(defaultKey);
    if (!defaultRaw) {
      await env.RESUME_KV.put(defaultKey, JSON.stringify(DEFAULT_THEME));
    }

    const listed = await env.RESUME_KV.list({ prefix: 'theme:' });
    const themes = await Promise.all(
      listed.keys.map(async ({ name: key }) => {
        const filename = key.replace('theme:', '');
        const raw = await env.RESUME_KV.get(key);
        if (!raw) return null;
        const theme = JSON.parse(raw) as { name: string };
        return { name: theme.name, filename };
      })
    );
    return ok(themes.filter(Boolean));
  } catch {
    return err('Failed to list themes');
  }
};

// POST /api/themes  — create a new theme
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const denied = await authGuard(request, env);
  if (denied) return denied;

  try {
    const theme = await request.json() as { name: string };
    const filename = sanitizeFilename(theme.name.toLowerCase().replace(/\s+/g, '-'));
    if (!filename) return err('Invalid theme name', 400);
    await env.RESUME_KV.put(`theme:${filename}`, JSON.stringify(theme));
    return new Response(JSON.stringify({ success: true, data: theme }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return err('Failed to create theme');
  }
};
