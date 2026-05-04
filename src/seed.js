require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool } = require('./db/pool');

async function seed() {
  const h1 = await bcrypt.hash('Admin123!', 10);
  const h2 = await bcrypt.hash('User12345', 10);

  await pool.query(
    `INSERT INTO users (email, password_hash, full_name, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO NOTHING`,
    ['admin@example.com', h1, 'Пользователь A']
  );

  await pool.query(
    `INSERT INTO users (email, password_hash, full_name, role)
     VALUES ($1, $2, $3, 'user')
     ON CONFLICT (email) DO NOTHING`,
    ['user@example.com', h2, 'Пользователь B']
  );

  const c0 = await pool.query('SELECT COUNT(*)::int AS n FROM items');
  if (c0.rows[0].n === 0) {
    await pool.query(
      `INSERT INTO items (title, description) VALUES
        ('Позиция 1', 'Описание 1'),
        ('Позиция 2', 'Описание 2'),
        ('Позиция 3', 'Описание 3')`
    );
    console.log('items: добавлены 3 демо-строки');
  } else {
    console.log('items: уже есть строки (', c0.rows[0].n, '), демо не добавлял');
  }

  const cnt = await pool.query('SELECT COUNT(*)::int AS n FROM items');
  const n = cnt.rows[0].n;
  console.log('seed ok: admin@example.com / Admin123!, user@example.com / User12345');
  console.log('items в базе:', n);
  await pool.end();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
