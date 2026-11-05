import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { startSubmissionWorker } from './queue/submission.worker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

async function main() {
  console.log('[Worker Daemon] Initializing AI Code Evolution Lab Execution Worker...');

  const mongoUri = sanitizeMongoUri(process.env.MONGODB_URI);
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('[Worker Daemon] Connected to MongoDB document store.');
  } catch (err: any) {
    console.warn('[Worker Daemon] MongoDB deferred/warning:', err.message);
  }

  const worker = startSubmissionWorker();

  worker.on('ready', () => {
    console.log('[Worker Daemon] BullMQ submission-queue worker is active and awaiting jobs.');
  });

  worker.on('error', (err) => {
    console.warn('[Worker Daemon] Worker warning (deferred):', err.message);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker Daemon] Job ${job?.id} failed:`, err.message);
  });

  process.on('SIGTERM', async () => {
    console.log('[Worker Daemon] Shutting down gracefully...');
    await worker.close();
    await mongoose.disconnect();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('[Worker Daemon] Fatal startup error:', err);
  process.exit(1);
});
