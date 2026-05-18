import { type Env, err, authGuard, arrayBufferToBase64 } from '../../_shared/helpers';

// SVG excluded: can contain embedded scripts (stored XSS). (A03)
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

const KNOWN_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// POST /api/upload/photo  and  POST /api/upload/logo
// Uses a fixed filename per type so new uploads replace old ones.
// Returns a user-scoped path when auth is enabled: /api/uploads/{userId}/{filename}
export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const guard = await authGuard(request, env);
  if (guard instanceof Response) return guard;

  const type = Array.isArray(params.type) ? params.type[0] : params.type;
  if (type !== 'photo' && type !== 'logo') return err('Upload type must be "photo" or "logo"', 400);

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) return err('No file uploaded', 400);
    if (!ALLOWED_MIME.includes(file.type)) return err('Invalid file type', 400);

    const ext = MIME_TO_EXT[file.type] ?? '.jpg';

    const buffer = await file.arrayBuffer();
    if (buffer.byteLength > MAX_SIZE) return err('File too large (max 5 MB)', 400);

    const filename = `${type}${ext}`;

    if (guard) {
      // Delete any previous upload for this type (different extension) for this user
      for (const e of KNOWN_EXTS) {
        await env.RESUME_KV.delete(`upload:${guard.userId}:${type}${e}`);
      }

      const base64 = arrayBufferToBase64(buffer);
      const dataUrl = `data:${file.type};base64,${base64}`;
      await env.RESUME_KV.put(`upload:${guard.userId}:${filename}`, dataUrl);

      const path = `/api/uploads/${guard.userId}/${filename}`;
      return new Response(JSON.stringify({ success: true, data: { path, filename } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      // Auth disabled — legacy single-user mode
      for (const e of KNOWN_EXTS) {
        await env.RESUME_KV.delete(`upload:${type}${e}`);
      }

      const base64 = arrayBufferToBase64(buffer);
      const dataUrl = `data:${file.type};base64,${base64}`;
      await env.RESUME_KV.put(`upload:${filename}`, dataUrl);

      const path = `/api/uploads/${filename}`;
      return new Response(JSON.stringify({ success: true, data: { path, filename } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch {
    return err('Upload failed');
  }
};
