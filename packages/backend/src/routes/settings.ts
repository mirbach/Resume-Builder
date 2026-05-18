import { Router, Request, Response } from 'express';
import { readJson, writeJson } from '../lib/storage.js';
import { invalidateProvider } from '../lib/get-provider.js';
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
  storage: {
    provider: 'local',
    s3: { bucket: '', region: 'us-east-1', accessKeyId: '', secretAccessKey: '', prefix: '', endpoint: '' },
    sharepoint: { tenantId: '', clientId: '', clientSecret: '', siteUrl: '', driveName: '', folderPath: '' },
  },
};

// GET /api/settings
// Returns settings with secret values stripped — only indicates whether each is configured.
// Also returns isAdmin based on the authenticated user's role claim (or ADMIN_SUB fallback).
router.get('/', async (req: Request, res: Response) => {
  try {
    const settings = await readJson<AppSettings>('settings.json').catch(() => DEFAULTS);

    const keysConfigured = {
      deeplApiKey: !!settings.translation?.deeplApiKey?.trim(),
      aiApiKey: !!settings.ai?.apiKey?.trim(),
      s3SecretKey: !!settings.storage?.s3?.secretAccessKey?.trim(),
      sharePointClientSecret: !!settings.storage?.sharepoint?.clientSecret?.trim(),
    };

    const safe: AppSettings = {
      ...settings,
      translation: { deeplApiKey: '' },
      ai: { ...settings.ai, apiKey: '' },
      storage: {
        ...settings.storage,
        provider: settings.storage?.provider ?? 'local',
        s3: { ...(settings.storage?.s3 ?? DEFAULTS.storage.s3), secretAccessKey: '' },
        sharepoint: { ...(settings.storage?.sharepoint ?? DEFAULTS.storage.sharepoint), clientSecret: '' },
      },
    };

    res.json({ success: true, data: safe, keysConfigured, isAdmin: req.user?.isAdmin ?? false });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to load settings' });
  }
});

// PUT /api/settings
// Merges with existing — secrets are only overwritten if a non-empty value is provided.
router.put('/', async (req: Request, res: Response) => {
  // When auth is enabled, only admins may change settings.
  // In single-user mode (auth disabled) req.user is absent and the check is skipped.
  if (req.user && !req.user.isAdmin) {
    res.status(403).json({ success: false, error: 'Forbidden: admin access required' });
    return;
  }

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
      storage: {
        provider: incoming.storage?.provider ?? existing.storage?.provider ?? 'local',
        s3: {
          ...(incoming.storage?.s3 ?? DEFAULTS.storage.s3),
          secretAccessKey: incoming.storage?.s3?.secretAccessKey?.trim()
            ? incoming.storage.s3.secretAccessKey
            : existing.storage?.s3?.secretAccessKey ?? '',
        },
        sharepoint: {
          ...(incoming.storage?.sharepoint ?? DEFAULTS.storage.sharepoint),
          clientSecret: incoming.storage?.sharepoint?.clientSecret?.trim()
            ? incoming.storage.sharepoint.clientSecret
            : existing.storage?.sharepoint?.clientSecret ?? '',
        },
      },
    };

    await writeJson('settings.json', merged);
    invalidateProvider();

    const keysConfigured = {
      deeplApiKey: !!merged.translation?.deeplApiKey?.trim(),
      aiApiKey: !!merged.ai?.apiKey?.trim(),
      s3SecretKey: !!merged.storage?.s3?.secretAccessKey?.trim(),
      sharePointClientSecret: !!merged.storage?.sharepoint?.clientSecret?.trim(),
    };
    const safe: AppSettings = {
      ...merged,
      translation: { deeplApiKey: '' },
      ai: { ...merged.ai, apiKey: '' },
      storage: {
        ...merged.storage,
        s3: { ...merged.storage.s3, secretAccessKey: '' },
        sharepoint: { ...merged.storage.sharepoint, clientSecret: '' },
      },
    };

    res.json({ success: true, data: safe, keysConfigured });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to save settings' });
  }
});

export default router;
