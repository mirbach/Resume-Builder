import { type Env, ok, err, authGuard, DEFAULT_RESUME } from '../_shared/helpers';

// GET /api/resume — public (no auth required to view)
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const raw = await env.RESUME_KV.get('resume');
    const data = raw ? JSON.parse(raw) : DEFAULT_RESUME;
    return ok(data);
  } catch {
    return err('Failed to load resume data');
  }
};

// PUT /api/resume
export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const denied = await authGuard(request, env);
  if (denied) return denied;

  try {
    const data = await request.json();
    await env.RESUME_KV.put('resume', JSON.stringify(data));
    return ok(data);
  } catch {
    return err('Failed to save resume data');
  }
};
