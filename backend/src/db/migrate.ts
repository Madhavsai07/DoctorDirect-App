import fs from 'fs';
import path from 'path';
import { pool } from './pool';

const MIGRATIONS_DIR = path.resolve(__dirname, '../../../database/migrations');
const SEEDS_DIR = path.resolve(__dirname, '../../../database/seeds');

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function getAppliedMigrations(): Promise<string[]> {
  const result = await pool.query<{ name: string }>(
    'SELECT name FROM _migrations ORDER BY id ASC'
  );
  return result.rows.map((row) => row.name);
}

export async function runMigrationsUp(): Promise<void> {
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error(`[Migrations] Directory not found: ${MIGRATIONS_DIR}`);
    return;
  }

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql') && !f.endsWith('_down.sql'))
    .sort();

  console.log(`[Migrations] Found ${files.length} migration file(s).`);

  for (const file of files) {
    if (applied.includes(file)) {
      console.log(`[Migrations] Already applied: ${file}`);
      continue;
    }

    console.log(`[Migrations] Applying: ${file}...`);
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`[Migrations] Successfully applied: ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`[Migrations] Failed applying ${file}:`, err);
      throw err;
    } finally {
      client.release();
    }
  }
}

export async function runMigrationsDown(): Promise<void> {
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();

  if (applied.length === 0) {
    console.log('[Migrations] No applied migrations to roll back.');
    return;
  }

  const lastMigration = applied[applied.length - 1];
  const downFile = lastMigration.replace(/\.sql$/, '_down.sql');
  const downFilePath = path.join(MIGRATIONS_DIR, downFile);

  if (!fs.existsSync(downFilePath)) {
    throw new Error(`[Migrations] Rollback file not found: ${downFilePath}`);
  }

  console.log(`[Migrations] Rolling back: ${lastMigration} using ${downFile}...`);
  const sql = fs.readFileSync(downFilePath, 'utf-8');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('DELETE FROM _migrations WHERE name = $1', [lastMigration]);
    await client.query('COMMIT');
    console.log(`[Migrations] Successfully rolled back: ${lastMigration}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`[Migrations] Failed rolling back ${lastMigration}:`, err);
    throw err;
  } finally {
    client.release();
  }
}

export async function runSeed(): Promise<void> {
  if (!fs.existsSync(SEEDS_DIR)) {
    console.error(`[Seeds] Directory not found: ${SEEDS_DIR}`);
    return;
  }

  const files = fs
    .readdirSync(SEEDS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  console.log(`[Seeds] Found ${files.length} seed file(s).`);

  for (const file of files) {
    console.log(`[Seeds] Executing seed: ${file}...`);
    const filePath = path.join(SEEDS_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log(`[Seeds] Successfully executed: ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`[Seeds] Failed executing seed ${file}:`, err);
      throw err;
    } finally {
      client.release();
    }
  }
}

export async function printMigrationStatus(): Promise<void> {
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql') && !f.endsWith('_down.sql'))
    .sort();

  console.log('\n=== Migration Status ===');
  for (const file of files) {
    const isApplied = applied.includes(file);
    console.log(`  [${isApplied ? 'APPLIED' : 'PENDING'}] ${file}`);
  }
  console.log('========================\n');
}

export async function runMigrationsReset(): Promise<void> {
  await ensureMigrationsTable();
  let applied = await getAppliedMigrations();
  console.log(`[Migrations] Resetting ${applied.length} applied migration(s)...`);
  while (applied.length > 0) {
    await runMigrationsDown();
    applied = await getAppliedMigrations();
  }
  console.log('[Migrations] Re-applying all migrations...');
  await runMigrationsUp();
}

// CLI handler when executed directly
if (require.main === module) {
  const command = process.argv[2] ?? 'up';

  (async () => {
    try {
      if (command === 'up') {
        await runMigrationsUp();
      } else if (command === 'down') {
        await runMigrationsDown();
      } else if (command === 'seed') {
        await runSeed();
      } else if (command === 'status') {
        await printMigrationStatus();
      } else if (command === 'reset') {
        await runMigrationsReset();
      } else {
        console.error(`Unknown command: ${command}. Use 'up', 'down', 'seed', 'status', or 'reset'.`);
        process.exit(1);
      }
      process.exit(0);
    } catch (err) {
      console.error('[Migrations] Execution failed:', err);
      process.exit(1);
    } finally {
      await pool.end();
    }
  })();
}
