require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool } = require('./db/pool');

const COURSES = [
  ['Основы алгоритмизации и программирования', 'Демо-курс 1'],
  ['Основы веб-дизайна', 'Демо-курс 2'],
  ['Основы проектирования баз данных', 'Демо-курс 3'],
];

async function seed() {
  const adminHash = await bcrypt.hash('KorokNET', 10);
  const userHash = await bcrypt.hash('User12345', 10);

  await pool.query(
    `INSERT INTO users (login, email, password_hash, full_name, phone, role)
     VALUES ($1, $2, $3, $4, $5, 'admin')
     ON CONFLICT (login) DO NOTHING`,
    ['Admin', 'admin@example.com', adminHash, 'Администратор Системы', '8(999)000-00-00']
  );

  await pool.query(
    `INSERT INTO users (login, email, password_hash, full_name, phone, role)
     VALUES ($1, $2, $3, $4, $5, 'user')
     ON CONFLICT (login) DO NOTHING`,
    ['student01', 'user@example.com', userHash, 'Иванов Иван Иванович', '8(912)345-67-89']
  );

  const c0 = await pool.query('SELECT COUNT(*)::int AS n FROM courses');
  if (c0.rows[0].n === 0) {
    for (const [title, description] of COURSES) {
      await pool.query('INSERT INTO courses (title, description) VALUES ($1, $2)', [
        title,
        description,
      ]);
    }
    console.log('courses: добавлены 3 демо-курса');
  } else {
    console.log('courses: уже есть строки (', c0.rows[0].n, ')');
  }

  console.log('seed ok:');
  console.log('  админ — логин Admin, пароль KorokNET');
  console.log('  пользователь — логин student01, пароль User12345');
  await pool.end();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
