import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { app } from './src/server/app.ts';

dotenv.config();

const PORT = process.env.PORT || 3000;
const DIST_PATH = path.resolve(process.cwd(), 'dist');

// Serve static frontend files in production
app.use(express.static(DIST_PATH));

// SPA catch-all fallback
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(DIST_PATH, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`⚡ VoltWork AI Server running on port ${PORT}`);
});
