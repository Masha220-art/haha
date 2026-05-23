require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./db/pool');

async function reset() {
  const resetSql = fs.readFileSync(path.join(__dirname, '..', 'sql', 'reset.sql'), 'utf8');
  const schemaSql = fs.readFileSync(path.join(__dirname, '..', 'sql', 'schema.sql'), 'utf8');
  await pool.query(resetSql);
  await pool.query(schemaSql);
  console.log('БД пересоздана (reset + schema).');
  await pool.end();
}

reset().catch((e) => {
  console.error(e);
  process.exit(1);
});
