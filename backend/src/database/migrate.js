const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pool } = require('../config/database');

const migrationsDirectory = path.resolve(__dirname, '../../../database/migrations');

async function migrate() {
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    filename TEXT PRIMARY KEY,
    checksum CHAR(64) NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  const basePresent = (await pool.query("SELECT to_regclass('public.users') AS users")).rows[0].users;
  if (!basePresent) {
    if (process.env.ALLOW_DISPOSABLE_SEED !== 'YES') {
      throw new Error('Base schema is missing; disposable bootstrap requires ALLOW_DISPOSABLE_SEED=YES');
    }
    const tableCount = Number((await pool.query(
      "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' AND table_name<>'schema_migrations'"
    )).rows[0].count);
    if (tableCount !== 0) throw new Error('Refusing base bootstrap because the database is not empty');
    for (const relativePath of ['database/schema.sql', 'database/schema_additions.sql', 'database/migrations/add_security_features.sql']) {
      const sql = await fs.readFile(path.resolve(__dirname, '../../..', relativePath), 'utf8');
      await pool.query(sql);
    }
    console.log('Applied base marketplace schema to an explicitly disposable empty database');
  }
  const filenames = (await fs.readdir(migrationsDirectory))
    .filter((name) => /^\d{8}_[a-z0-9_]+\.sql$/.test(name))
    .sort();
  for (const filename of filenames) {
    const sql = await fs.readFile(path.join(migrationsDirectory, filename), 'utf8');
    const checksum = crypto.createHash('sha256').update(sql).digest('hex');
    const prior = (await pool.query('SELECT checksum FROM schema_migrations WHERE filename=$1', [filename])).rows[0];
    if (prior) {
      if (prior.checksum !== checksum) throw new Error(`Applied migration changed: ${filename}`);
      continue;
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(filename,checksum) VALUES($1,$2)', [filename, checksum]);
      await client.query('COMMIT');
      console.log(`Applied ${filename}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

if (require.main === module) {
  migrate().then(() => pool.end()).catch(async (error) => {
    console.error(error.message);
    await pool.end();
    process.exitCode = 1;
  });
}

module.exports = { migrate };
