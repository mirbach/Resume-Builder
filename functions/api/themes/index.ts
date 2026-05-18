import { type Env, ok, err, authGuard, sanitizeFilename, DEFAULT_THEME } from '../../_shared/helpers';

// GET /api/themes — returns global (company) themes merged with user's personal themes
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const guard = await authGuard(request, env);
  if (guard instanceof Response) return guard;

  try {
    // Seed global default theme if it doesn't exist yet
    const defaultRaw = await env.RESUME_KV.get('theme:default');
    if (!defaultRaw) {
      await env.RESUME_KV.put('theme:default', JSON.stringify(DEFAULT_THEME));
    }

    // List global themes (prefix: 'theme:')
    const globalListed = await env.RESUME_KV.list({ prefix: 'theme:' });
    const globalThemes = await Promise.all(
      globalListed.keys.map(async ({ name: key }) => {
        const filename = key.replace('theme:', '');
        const raw = await env.RESUME_KV.get(key);
        if (!raw) return null;
        const theme = JSON.parse(raw) as { name: string };
        return { name: theme.name, filename, isGlobal: true };
      })
    );

    if (!guard) {
      // Auth disabled — single-user mode, return global themes only
      return ok(globalThemes.filter(Boolean));
    }

    // List user's personal themes (prefix: 'theme:{userId}:')
    const userPrefix = `theme:${guard.userId}:`;
    const userListed = await env.RESUME_KV.list({ prefix: userPrefix });
    const userThemes = await Promise.all(
      userListed.keys.map(async ({ name: key }) => {
        const filename = key.replace(userPrefix, '');
        const raw = await env.RESUME_KV.get(key);
        if (!raw) return null;
        const theme = JSON.parse(raw) as { name: string };
        return { name: theme.name, filename, isGlobal: false };
      })
    );

    // User themes shadow global themes with the same filename
    const userFilenames = new Set(userThemes.filter(Boolean).map(t => t!.filename));
    const merged = [
      ...globalThemes.filter(t => t && !userFilenames.has(t.filename)),
      ...userThemes,
    ].filter(Boolean);

    return ok(merged);
  } catch {
    return err('Failed to list themes');
  }
};

// POST /api/themes — admins write to global scope; regular users write to personal scope
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const guard = await authGuard(request, env);
  if (guard instanceof Response) return guard;

  try {
    const theme = await request.json() as { name: string };
    const filename = sanitizeFilename(theme.name.toLowerCase().replace(/\s+/g, '-'));
    if (!filename) return err('Invalid theme name', 400);

    let key: string;
    if (!guard) {
      // Auth disabled — single-user mode, write to global scope
      key = `theme:${filename}`;
    } else if (guard.isAdmin) {
      key = `theme:${filename}`;
    } else {
      key = `theme:${guard.userId}:${filename}`;
    }

    await env.RESUME_KV.put(key, JSON.stringify(theme));
    return new Response(JSON.stringify({ success: true, data: theme }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return err('Failed to create theme');
  }
};
