import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { subToUserId } from '../lib/storage.js';
import { getProvider, ensureUserData } from '../lib/get-provider.js';

const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Always use memory storage — the active provider handles persistence
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

const router = Router();

// POST /api/upload/:type - upload a photo or logo (replaces any previous file)
router.post('/:type', upload.single('file'), async (req: Request, res: Response) => {
  const type = req.params.type;
  if (type !== 'photo' && type !== 'logo') {
    res.status(400).json({ success: false, error: 'Upload type must be "photo" or "logo"' });
    return;
  }
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No file uploaded' });
    return;
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  if (!ALLOWED_EXTS.includes(ext)) {
    res.status(400).json({ success: false, error: 'Invalid file extension' });
    return;
  }

  try {
    const provider = await getProvider();
    const filename = `${type}${ext}`;

    if (req.user) {
      await ensureUserData(provider, req.user.sub);
      const userId = subToUserId(req.user.sub);
      const prefix = `users/${userId}/uploads/`;

      // Remove any previously uploaded file with the same base name
      const existing = await provider.listBinaryKeys(prefix);
      for (const k of existing) {
        if (k.startsWith(`${type}.`)) {
          await provider.deleteBinary(`${prefix}${k}`).catch(() => undefined);
        }
      }

      const key = `${prefix}${filename}`;
      await provider.writeBinary(key, req.file.buffer, req.file.mimetype);

      res.json({ success: true, data: { path: `/api/uploads/${userId}/${filename}`, filename } });
    } else {
      const prefix = 'uploads/';
      const existing = await provider.listBinaryKeys(prefix);
      for (const k of existing) {
        if (k.startsWith(`${type}.`)) {
          await provider.deleteBinary(`${prefix}${k}`).catch(() => undefined);
        }
      }

      const key = `${prefix}${filename}`;
      await provider.writeBinary(key, req.file.buffer, req.file.mimetype);

      res.json({ success: true, data: { path: `/api/uploads/${filename}`, filename } });
    }
  } catch {
    res.status(500).json({ success: false, error: 'Failed to save upload' });
  }
});

// GET /api/uploads/:userId/:filename - serve a user's uploaded file (multi-user mode)
router.get('/:userId/:filename', async (req: Request, res: Response) => {
  const userId = (Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId)
    .replace(/[^a-f0-9]/g, '');
  const raw = Array.isArray(req.params.filename) ? req.params.filename[0] : req.params.filename;
  const filename = raw.replace(/[^a-zA-Z0-9._-]/g, '');

  if (!userId || !filename) {
    res.status(400).json({ success: false, error: 'Invalid path' });
    return;
  }

  // Object-level authorization: authenticated users may only fetch their own uploads.
  if (req.user && subToUserId(req.user.sub) !== userId) {
    res.status(403).json({ success: false, error: 'Forbidden' });
    return;
  }

  try {
    const provider = await getProvider();
    const { buffer, mimeType } = await provider.readBinary(`users/${userId}/uploads/${filename}`);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.send(buffer);
  } catch {
    res.status(404).json({ success: false, error: 'File not found' });
  }
});

// GET /api/uploads/:filename - serve uploaded files (single-user / auth-disabled mode)
router.get('/:filename', async (req: Request, res: Response) => {
  const raw = Array.isArray(req.params.filename) ? req.params.filename[0] : req.params.filename;
  const filename = raw.replace(/[^a-zA-Z0-9._-]/g, '');

  if (!filename) {
    res.status(400).json({ success: false, error: 'Invalid filename' });
    return;
  }

  try {
    const provider = await getProvider();
    const { buffer, mimeType } = await provider.readBinary(`uploads/${filename}`);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.send(buffer);
  } catch {
    res.status(404).json({ success: false, error: 'File not found' });
  }
});

export default router;
