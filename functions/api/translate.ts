import { type Env, ok, err, authGuard } from '../_shared/helpers';

// POST /api/translate
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const denied = await authGuard(request, env);
  if (denied) return denied;

  try {
    const { text, from, to } = await request.json() as { text: string; from: string; to: string };

    if (!text || !from || !to) {
      return err('Missing required fields: text, from, to', 400);
    }
    if (!['en', 'de'].includes(from) || !['en', 'de'].includes(to)) {
      return err('Unsupported language. Only "en" and "de" are supported.', 400);
    }

    const raw = await env.RESUME_KV.get('settings');
    const settings = raw ? JSON.parse(raw) as Record<string, unknown> : null;
    const apiKey = (settings?.translation as { deeplApiKey?: string } | undefined)?.deeplApiKey?.trim();

    if (!apiKey) {
      return err('DeepL API key not configured. Go to Settings → Translation to add your key.', 400);
    }

    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: [text],
        source_lang: from.toUpperCase(),
        target_lang: to.toUpperCase(),
      }),
    });

    if (!response.ok) {
      if (response.status === 403) {
        return err('Invalid DeepL API key.', 400);
      }
      const body = await response.text();
      return err(`DeepL error (${response.status}): ${body}`);
    }

    const data = await response.json() as { translations: { text: string }[] };
    const translated = data.translations[0]?.text ?? '';

    return ok(translated);
  } catch {
    return err('Translation request failed');
  }
};
