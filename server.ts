import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './server/api/routes.js';
import { tradingWorker } from './server/engine/tradingWorker.js';
import { scheduler } from './server/engine/scheduler.js';
import { storage } from './server/storage.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Mount API routes
  app.use('/api', apiRouter);

  // Initialize and start persistent cloud trading engine & scheduler
  await tradingWorker.start();

  scheduler.start({
    onStartBot: async (bot) => {
      await tradingWorker.deployBot(bot.id);
    },
    onStopBot: async (bot, reason) => {
      await tradingWorker.stopBot(bot.id, reason);
    }
  });

  // In development, mount Vite dev middlewares
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OTIVO CLOUD ENGINE] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[OTIVO CLOUD ENGINE] Persistent worker initialized. 24/7 background process active.`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    console.log(`[SHUTDOWN] Received ${signal}. Performing graceful state flush...`);
    scheduler.stop();
    server.close(() => {
      storage.addLog({
        level: 'INFO',
        message: `[SERVER] Process terminated gracefully on signal ${signal}.`
      });
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

createServer().catch((err) => {
  console.error('[FATAL] Failed to start OTIVO server:', err);
  process.exit(1);
});
