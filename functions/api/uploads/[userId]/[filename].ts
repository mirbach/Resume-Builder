import { type Env, err, authGuard } from '../../../_shared/helpers';

const MIME_FROM_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
};

// GET /api/uploads/:userId/:filename — serve a user's uploaded file (multi-user mode)
export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  // Require authentication — this endpoint only exists in multi-user (auth-enabled) mode
  const guard = await authGuard(request, env);
  if (guard instanceof Response) return guard;

  // Only allow hex characters for userId (SHA-256 hash)
  const rawUserId = Array.isArray(params.userId) ? params.userId[0] : params.userId;
  const userId = rawUserId.replace(/[^a-f0-9]/g, '');
  if (!userId) return err('Invalid user', 400);

  // Object-level authorization: the authenticated user may only fetch their own uploads.
  // guard.userId is the SHA-256 userId when auth is enabled; guard is null when disabled.
  if (guard !== null && guard.userId !== userId) return err('Forbidden', 403);

  const rawFilename = Array.isArray(params.filename) ? params.filename[0] : params.filename;
  const filename = rawFilename.replace(/[^a-zA-Z0-9._-]/g, '');
  if (!filename) return err('Invalid filename', 400);

  try {
    const dataUrl = await env.RESUME_KV.get(`upload:${userId}:${filename}`);
    if (!dataUrl) return err('Not found', 404);

    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return err('Corrupt upload data', 500);

    const [, mime, b64] = match;
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return new Response(bytes, {
      headers: {
        'Content-Type': mime,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return err('Failed to serve file');
  }
};
