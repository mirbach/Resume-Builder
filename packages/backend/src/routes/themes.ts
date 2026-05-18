import { Router, Request, Response } from 'express';
import { subToUserId } from '../lib/storage.js';
import { getProvider, ensureUserData } from '../lib/get-provider.js';
import type { ResumeTheme, ThemeListItem } from '../types.js';

const router = Router();

function getParam(params: Record<string, string | string[]>, key: string): string {
  const val = params[key];
  return Array.isArray(val) ? val[0] : val;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '');
}

// GET /api/themes - list all themes
router.get('/', async (req: Request, res: Response) => {
  try {
    const provider = await getProvider();
    const globalFiles = await provider.listKeys('themes/');
    const globalThemes: (ThemeListItem & { isGlobal: boolean })[] = await Promise.all(
      globalFiles.map(async (filename) => {
        const theme = await provider.readJson<ResumeTheme>(`themes/${filename}`);
        return { name: theme.name, filename: filename.replace('.json', ''), isGlobal: true };
      })
    );

    if (!req.user) {
      return res.json({ success: true, data: globalThemes });
    }

    await ensureUserData(provider, req.user.sub);
    const userId = subToUserId(req.user.sub);
    const userFiles = await provider.listKeys(`users/${userId}/themes/`);
    const userThemes: (ThemeListItem & { isGlobal: boolean })[] = await Promise.all(
      userFiles.map(async (filename) => {
        const theme = await provider.readJson<ResumeTheme>(`users/${userId}/themes/${filename}`);
        return { name: theme.name, filename: filename.replace('.json', ''), isGlobal: false };
      })
    );

    const userFilenames = new Set(userThemes.map(t => t.filename));
    const merged = [
      ...globalThemes.filter(t => !userFilenames.has(t.filename)),
      ...userThemes,
    ];

    res.json({ success: true, data: merged });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to list themes' });
  }
});

// GET /api/themes/:name - get a specific theme
router.get('/:name', async (req: Request, res: Response) => {
  try {
    const name = sanitizeFilename(getParam(req.params, 'name'));
    const provider = await getProvider();

    if (req.user) {
      await ensureUserData(provider, req.user.sub);
      const userId = subToUserId(req.user.sub);
      const userKey = `users/${userId}/themes/${name}.json`;
      if (await provider.keyExists(userKey)) {
        const theme = await provider.readJson<ResumeTheme>(userKey);
        return res.json({ success: true, data: theme });
      }
    }

    const theme = await provider.readJson<ResumeTheme>(`themes/${name}.json`);
    res.json({ success: true, data: theme });
  } catch {
    res.status(404).json({ success: false, error: 'Theme not found' });
  }
});

// POST /api/themes - create a new theme
// Admins write to the global scope; regular users write to their personal scope.
router.post('/', async (req: Request, res: Response) => {
  try {
    const theme = req.body as ResumeTheme;
    const filename = sanitizeFilename(theme.name.toLowerCase().replace(/\s+/g, '-'));
    const provider = await getProvider();

    if (req.user?.isAdmin) {
      await provider.writeJson(`themes/${filename}.json`, theme);
    } else if (req.user) {
      await ensureUserData(provider, req.user.sub);
      const userId = subToUserId(req.user.sub);
      await provider.writeJson(`users/${userId}/themes/${filename}.json`, theme);
    } else {
      // Single-user mode (auth disabled) — write to global scope
      await provider.writeJson(`themes/${filename}.json`, theme);
    }

    res.status(201).json({ success: true, data: theme });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to create theme' });
  }
});

// PUT /api/themes/:name - update a theme
// Admins may update global themes; regular users may only update their own personal themes.
router.put('/:name', async (req: Request, res: Response) => {
  try {
    const name = sanitizeFilename(getParam(req.params, 'name'));
    const theme = req.body as ResumeTheme;
    const provider = await getProvider();

    if (req.user?.isAdmin) {
      // Admin: write to global scope
      await provider.writeJson(`themes/${name}.json`, theme);
    } else if (req.user) {
      // Regular user: check they are not targeting a global theme
      const isGlobal = await provider.keyExists(`themes/${name}.json`);
      if (isGlobal) {
        res.status(403).json({ success: false, error: 'Forbidden: only admins can edit company themes' });
        return;
      }
      await ensureUserData(provider, req.user.sub);
      const userId = subToUserId(req.user.sub);
      await provider.writeJson(`users/${userId}/themes/${name}.json`, theme);
    } else {
      // Single-user mode
      await provider.writeJson(`themes/${name}.json`, theme);
    }

    res.json({ success: true, data: theme });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to update theme' });
  }
});

// DELETE /api/themes/:name - delete a theme (only personal themes)
router.delete('/:name', async (req: Request, res: Response) => {
  try {
    const name = sanitizeFilename(getParam(req.params, 'name'));
    const provider = await getProvider();

    if (req.user) {
      await ensureUserData(provider, req.user.sub);
      const userId = subToUserId(req.user.sub);
      const userKey = `users/${userId}/themes/${name}.json`;
      if (!(await provider.keyExists(userKey))) {
        const isGlobal = await provider.keyExists(`themes/${name}.json`);
        if (isGlobal) {
          res.status(403).json({ success: false, error: 'Cannot delete a company theme' });
        } else {
          res.status(404).json({ success: false, error: 'Theme not found' });
        }
        return;
      }
      await provider.deleteKey(userKey);
    } else {
      if (name === 'default') {
        res.status(400).json({ success: false, error: 'Cannot delete the default theme' });
        return;
      }
      await provider.deleteKey(`themes/${name}.json`);
    }

    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete theme' });
  }
});

export default router;
