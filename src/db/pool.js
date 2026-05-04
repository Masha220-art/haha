const { Pool } = require('pg');

function getPoolConfig() {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL, max: 10 };
  }
  const name = process.env.DB_NAME;
  const user = process.env.DB_USER;
  if (name && user) {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: name,
      user,
      password: process.env.DB_PASSWORD || '',
      max: 10,
    };
  }
  return null;
}

const cfg = getPoolConfig();
if (!cfg) {
  console.error(
    'В .env нужен либо DATABASE_URL, либо связка DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD'
  );
  process.exit(1);
}

const pool = new Pool(cfg);

module.exports = { pool };
