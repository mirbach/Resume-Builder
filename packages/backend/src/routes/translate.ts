import { Router, type Request, type Response } from 'express';
import { readJson } from '../lib/storage.js';
import type { AppSettings } from '../types.js';

const router = Router();

// POST /api/translate
router.post('/', async (req: Request, res: Response) => {
  try {
    const { text, from, to } = req.body as { text: string; from: string; to: string };

    if (!text || !from || !to) {
      return res.status(400).json({ success: false, error: 'Missing required fields: text, from, to' });
    }
    // Validate enum values (A03 — prevent injection via lang params)
    if (!['en', 'de'].includes(from) || !['en', 'de'].includes(to)) {
      return res.status(400).json({ success: false, error: 'Unsupported language. Only "en" and "de" are supported.' });
    }
    // Limit text size to prevent API key exhaustion (A04)
    if (typeof text !== 'string' || text.length > 10_000) {
      return res.status(400).json({ success: false, error: 'Text exceeds maximum allowed length of 10,000 characters.' });
    }

    const settings = await readJson<AppSettings>('settings.json').catch(() => null);
    const apiKey = settings?.translation?.deeplApiKey?.trim();

    if (!apiKey) {
      return res.status(400).json({ success: false, error: 'DeepL API key not configured. Go to Settings → Translation to add your key.' });
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
        return res.status(400).json({ success: false, error: 'Invalid DeepL API key.' });
      }
      const body = await response.text();
      return res.status(500).json({ success: false, error: `DeepL error (${response.status}): ${body}` });
    }

    const data = await response.json() as { translations: { text: string }[] };
    const translated = data.translations[0]?.text ?? '';

    return res.json({ success: true, data: translated });
  } catch {
    return res.status(500).json({ success: false, error: 'Translation request failed' });
  }
});

export default router;
