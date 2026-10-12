/**
 * AIWA v2 - Database Migration Runner
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPool, closePool } from './index.js';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function runMigrations() {
  console.log('[DB Migrate] Starting database migration...');
  const pool = getPool();
  const client = await pool.connect();

  try {
    const migrationPath = join(__dirname, 'migrations', '001_initial.sql');
    console.log(`[DB Migrate] Reading migration file: ${migrationPath}`);
    const sql = readFileSync(migrationPath, 'utf8');

    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    console.log('[DB Migrate] Migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[DB Migrate] Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await closePool();
  }
}

runMigrations().catch((err) => {
  console.error('[DB Migrate] Unexpected error:', err);
  process.exit(1);
});
