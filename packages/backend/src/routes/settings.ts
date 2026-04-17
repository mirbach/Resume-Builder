import { Router, Request, Response } from 'express';
import { readJson, writeJson } from '../lib/storage.js';
import type { AppSettings } from '../types.js';

const router = Router();

const DEFAULTS: AppSettings = {
  auth: {
    enabled: false,
    provider: 'generic-oidc',
    clientId: '',
    authority: '',
    redirectUri: 'http://localhost:5173/callback',
    scopes: ['openid', 'profile', 'email'],
  },
  translation: { deeplApiKey: '' },
  ai: { provider: 'openai', apiKey: '', model: '' },
};

// GET /api/settings
// Returns settings with API key values stripped — only indicates whether each key is configured.
router.get('/', async (_req: Request, res: Response) => {
  try {
    const settings = await readJson<AppSettings>('settings.json').catch(() => DEFAULTS);

    const keysConfigured = {
      deeplApiKey: !!settings.translation?.deeplApiKey?.trim(),
      aiApiKey: !!settings.ai?.apiKey?.trim(),
    };

    // Never send actual key values to the client
    const safe: AppSettings = {
      ...settings,
      translation: { deeplApiKey: '' },
      ai: { ...settings.ai, apiKey: '' },
    };

    res.json({ success: true, data: safe, keysConfigured });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to load settings' });
  }
});

// PUT /api/settings
// Merges with existing settings — key fields are only overwritten if a non-empty value is provided.
router.put('/', async (req: Request, res: Response) => {
  try {
    const incoming = req.body as AppSettings;
    const existing = await readJson<AppSettings>('settings.json').catch(() => DEFAULTS);

    const merged: AppSettings = {
      ...incoming,
      translation: {
        deeplApiKey: incoming.translation?.deeplApiKey?.trim()
          ? incoming.translation.deeplApiKey
          : existing.translation?.deeplApiKey ?? '',
      },
      ai: {
        ...incoming.ai,
        apiKey: incoming.ai?.apiKey?.trim()
          ? incoming.ai.apiKey
          : existing.ai?.apiKey ?? '',
      },
    };

    await writeJson('settings.json', merged);

    // Return the same safe shape as GET
    const keysConfigured = {
      deeplApiKey: !!merged.translation?.deeplApiKey?.trim(),
      aiApiKey: !!merged.ai?.apiKey?.trim(),
    };
    const safe: AppSettings = {
      ...merged,
      translation: { deeplApiKey: '' },
      ai: { ...merged.ai, apiKey: '' },
    };

    res.json({ success: true, data: safe, keysConfigured });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to save settings' });
  }
});

export default router;
