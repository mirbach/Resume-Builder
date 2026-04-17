import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import resumeRoutes from './routes/resume.js';
import themesRoutes from './routes/themes.js';
import uploadsRoutes from './routes/uploads.js';
import settingsRoutes from './routes/settings.js';
import translateRoutes from './routes/translate.js';
import aiRoutes from './routes/ai.js';
import { authMiddleware } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers (A05)
app.use(helmet({
  // CSP is managed by the frontend Vite build; disable the header here
  // so helmet doesn't conflict with Vite dev server responses.
  contentSecurityPolicy: false,
}));

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Auth middleware (only blocks when auth is enabled in settings)
app.use('/api', authMiddleware);

// Routes
app.use('/api/resume', resumeRoutes);
app.use('/api/themes', themesRoutes);
app.use('/api/upload', uploadsRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/translate', translateRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Resume API server running on http://localhost:${PORT}`);
});

export default app;
