import { Router, Request, Response } from 'express';
import { readJson, writeJson } from '../lib/storage.js';
import type { AppSettings } from '../types.js';

const router = Router();

// GET /api/settings
router.get('/', async (_req: Request, res: Response) => {
  try {
    const settings = await readJson<AppSettings>('settings.json');
    res.json({ success: true, data: settings });
  } catch {
    // Return defaults if file doesn't exist
    const defaults: AppSettings = {
      auth: {
        enabled: false,
        provider: 'generic-oidc',
        clientId: '',
        authority: '',
        redirectUri: 'http://localhost:5173/callback',
        scopes: ['openid', 'profile', 'email'],
      },
      translation: { deeplApiKey: '' },
    };
    res.json({ success: true, data: defaults });
  }
});

// PUT /api/settings
router.put('/', async (req: Request, res: Response) => {
  try {
    const settings = req.body as AppSettings;
    await writeJson('settings.json', settings);
    res.json({ success: true, data: settings });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to save settings' });
  }
});

export default router;
