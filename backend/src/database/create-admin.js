'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const { pool } = require('../config/database');

async function main() {
  const email = String(process.env.ADMIN_EMAIL || process.env.BOOTSTRAP_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || process.env.BOOTSTRAP_ADMIN_PASSWORD || '');
  if (!email || !email.includes('@')) throw new Error('ADMIN_EMAIL must be a valid email address.');
  if (password.length < 12 || password.length > 72) throw new Error('ADMIN_PASSWORD must contain 12-72 characters.');
  if ((await pool.query('SELECT id FROM users WHERE email=$1', [email])).rowCount) {
    console.log(`Administrator ${email} already exists; no changes made.`);
    return;
  }
  const suffix = crypto.randomBytes(5).toString('hex');
  await pool.query(
    `INSERT INTO users(username,email,password_hash,first_name,last_name,is_verified,is_admin,email_verified,status)
     VALUES($1,$2,$3,'Runtime','Administrator',true,true,true,'active')`,
    [`runtime_${suffix}`, email, await bcrypt.hash(password, 12)],
  );
  console.log(`Created administrator ${email}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(() => pool.end());
