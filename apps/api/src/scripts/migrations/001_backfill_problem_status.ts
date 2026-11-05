import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sanitizeMongoUri } from '@aica/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });
dotenv.config();

const MIGRATION_VERSION = '001_backfill_problem_status';

export async function up() {
  const mongoUri = sanitizeMongoUri(process.env.MONGODB_URI);
  console.log(`[Migration ${MIGRATION_VERSION}] Connecting to MongoDB: ${mongoUri.replace(/:([^:@]{3,})@/, ':***@')}...`);
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error('Database connection instance is undefined');
  }

  console.log(`[Migration ${MIGRATION_VERSION}] Starting UP execution...`);

  // 1. Audit current state
  const total = await db.collection('problems').countDocuments({});
  const unversioned = await db.collection('problems').countDocuments({ status: { $exists: false } });
  console.log(`[Migration] Total problems: ${total}, Lacking status field: ${unversioned}`);

  // 2. Idempotent backfill: only update problems where status is missing
  const res = await db.collection('problems').updateMany(
    { status: { $exists: false } },
    {
      $set: {
        status: 'PUBLISHED',
        version: 1,
        migratedAt: new Date(),
        migrationVersion: MIGRATION_VERSION
      }
    }
  );

  console.log(`[Migration UP] Successfully backfilled ${res.modifiedCount} documents with status='PUBLISHED'.`);

  // 3. Ensure compound index exists
  await db.collection('problems').createIndex({ status: 1, difficulty: 1, createdAt: -1 });
  console.log(`[Migration UP] Verified compound index { status: 1, difficulty: 1, createdAt: -1 }.`);

  await mongoose.disconnect();
  console.log(`[Migration ${MIGRATION_VERSION}] Completed successfully.`);
}

export async function down() {
  const mongoUri = sanitizeMongoUri(process.env.MONGODB_URI);
  console.log(`[Migration ${MIGRATION_VERSION}] Connecting for DOWN rollback...`);
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error('Database connection instance is undefined');
  }

  console.log(`[Migration ${MIGRATION_VERSION}] Starting DOWN execution...`);

  const res = await db.collection('problems').updateMany(
    { migrationVersion: MIGRATION_VERSION },
    {
      $unset: {
        status: '',
        version: '',
        migratedAt: '',
        migrationVersion: ''
      }
    }
  );

  console.log(`[Migration DOWN] Successfully reverted ${res.modifiedCount} documents.`);
  await mongoose.disconnect();
  console.log(`[Migration ${MIGRATION_VERSION}] Rollback completed.`);
}

// CLI execution check
const isDirectCli = process.argv[1] && process.argv[1].endsWith('001_backfill_problem_status.ts');
if (isDirectCli) {
  const mode = process.argv[2];
  if (mode === '--up') {
    up().catch((err) => {
      console.error('[Migration Error]', err);
      process.exit(1);
    });
  } else if (mode === '--down') {
    down().catch((err) => {
      console.error('[Migration Rollback Error]', err);
      process.exit(1);
    });
  } else {
    console.log('Usage: npx tsx apps/api/src/scripts/migrations/001_backfill_problem_status.ts [--up | --down]');
  }
}
