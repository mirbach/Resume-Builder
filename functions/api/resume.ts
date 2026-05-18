import { type Env, ok, err, authGuard, DEFAULT_RESUME } from '../_shared/helpers';

// GET /api/resume — scoped to user when auth is enabled
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const guard = await authGuard(request, env);
  if (guard instanceof Response) return guard;

  try {
    const key = guard ? `resume:${guard.userId}` : 'resume';
    const raw = await env.RESUME_KV.get(key);
    const data = raw ? JSON.parse(raw) : DEFAULT_RESUME;
    return ok(data);
  } catch {
    return err('Failed to load resume data');
  }
};

// PUT /api/resume
export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const guard = await authGuard(request, env);
  if (guard instanceof Response) return guard;

  try {
    const data = await request.json();
    const key = guard ? `resume:${guard.userId}` : 'resume';
    await env.RESUME_KV.put(key, JSON.stringify(data));
    return ok(data);
  } catch {
    return err('Failed to save resume data');
  }
};
