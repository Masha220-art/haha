const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../db/pool');

const router = express.Router();

router.get('/register', (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.render('auth/register', { title: 'Регистрация', err: null, register1: {} });
});

router.post('/register', async (req, res) => {
  const { email, password, full_name } = req.body;
  const register1 = { email: email || '', full_name: full_name || '' };

  if (!email || !password || !full_name) {
    return res.status(400).render('auth/register', {
      title: 'Регистрация',
      err: 'Заполните поля.',
      register1,
    });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const q = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, 'user')
       RETURNING id, email, full_name, role`,
      [email.trim().toLowerCase(), hash, full_name.trim()]
    );
    const userRow = q.rows[0];
    req.session.userId = userRow.id;
    req.session.email = userRow.email;
    req.session.fullName = userRow.full_name;
    req.session.role = userRow.role;
    const nextUrl = req.query.next || '/';
    res.redirect(nextUrl === '/auth/login' ? '/' : nextUrl);
  } catch (e) {
    if (e.code === '23505') {
      return res.status(400).render('auth/register', {
        title: 'Регистрация',
        err: 'Email уже занят.',
        register1,
      });
    }
    console.error(e);
    res.status(500).render('auth/register', {
      title: 'Регистрация',
      err: 'Ошибка сервера.',
      register1,
    });
  }
});

router.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.render('auth/login', {
    title: 'Вход',
    err: null,
    loginForm: {},
    next: typeof req.query.next === 'string' ? req.query.next : '',
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const loginForm = { email: email || '' };

  if (!email || !password) {
    return res.status(400).render('auth/login', {
      title: 'Вход',
      err: 'Введите email и пароль.',
      loginForm,
      next: (req.body.next || '').toString(),
    });
  }

  try {
    const q = await pool.query(
      'SELECT id, email, password_hash, full_name, role FROM users WHERE email = $1',
      [email.trim().toLowerCase()]
    );
    const userRow = q.rows[0];
    if (!userRow || !(await bcrypt.compare(password, userRow.password_hash))) {
      return res.status(400).render('auth/login', {
        title: 'Вход',
        err: 'Неверные данные.',
        loginForm,
        next: (req.body.next || '').toString(),
      });
    }
    req.session.userId = userRow.id;
    req.session.email = userRow.email;
    req.session.fullName = userRow.full_name;
    req.session.role = userRow.role;
    const nextRaw = (req.body.next || req.query.next || '/').toString();
    const nextUrl = nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/';
    res.redirect(nextUrl);
  } catch (e) {
    console.error(e);
    res.status(500).render('auth/login', {
      title: 'Вход',
      err: 'Ошибка сервера.',
      loginForm,
      next: (req.body.next || '').toString(),
    });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
