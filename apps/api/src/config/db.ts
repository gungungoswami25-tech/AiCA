import pg from 'pg';
import mongoose from 'mongoose';
import { Redis } from 'ioredis';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PostgreSQL Connection Pool
const { Pool } = pg;
export const pgPool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'aica_lab',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Redis Client
export const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  lazyConnect: true
});

export const redisSubscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  lazyConnect: true
});

// Database Initialization Helper
export async function initializeDatabases(): Promise<void> {
  // 1. Connect to PostgreSQL and apply migrations
  try {
    const client = await pgPool.connect();
    console.log('[PostgreSQL] Connected successfully to aica_lab database.');
    
    // Read and run schema.sql
    const schemaPath = path.resolve(__dirname, '../models/postgres/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(sql);
      console.log('[PostgreSQL] Database migrations verified and applied.');
    }
    client.release();
  } catch (err: any) {
    console.warn('[PostgreSQL] Warning: Connection deferred or offline:', err.message);
  }

  // 2. Connect to MongoDB
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aica_lab';
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('[MongoDB] Connected successfully to Mongoose store.');
  } catch (err: any) {
    console.warn('[MongoDB] Warning: Connection deferred or offline:', err.message);
  }

  // 3. Connect to Redis
  try {
    await redisClient.connect();
    await redisSubscriber.connect();
    console.log('[Redis] Connected successfully to Redis 7.2 broker.');
  } catch (err: any) {
    console.warn('[Redis] Warning: Redis connection deferred or offline:', err.message);
  }
}
