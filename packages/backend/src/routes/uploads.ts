import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getDataPath } from '../lib/storage.js';

const UPLOADS_DIR = getDataPath('uploads');

// SVG is intentionally excluded: SVGs can contain embedded scripts (stored XSS) and
// are not needed for profile photos or logos (PNG/JPG/WebP are sufficient). (A03)
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      cb(new Error('Invalid file type'), '');
      return;
    }
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

const router = Router();

// POST /api/upload/photo - upload a profile photo
router.post('/photo', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No file uploaded' });
    return;
  }
  const filePath = `/api/uploads/${req.file.filename}`;
  res.json({ success: true, data: { path: filePath, filename: req.file.filename } });
});

// POST /api/upload/logo - upload a company logo
router.post('/logo', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No file uploaded' });
    return;
  }
  const filePath = `/api/uploads/${req.file.filename}`;
  res.json({ success: true, data: { path: filePath, filename: req.file.filename } });
});

// GET /api/uploads/:filename - serve uploaded files
router.get('/:filename', (req: Request, res: Response) => {
  const raw = Array.isArray(req.params.filename) ? req.params.filename[0] : req.params.filename;
  const filename = raw.replace(/[^a-zA-Z0-9._-]/g, '');
  const filePath = path.join(UPLOADS_DIR, filename);
  // Verify file is within uploads directory (prevent path traversal)
  if (!filePath.startsWith(UPLOADS_DIR)) {
    res.status(403).json({ success: false, error: 'Access denied' });
    return;
  }
  res.sendFile(filePath);
});

export default router;
