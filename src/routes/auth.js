const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../db/pool');
const { validateRegister, validateLoginForm } = require('../lib/validation');

const router = express.Router();

function setSession(req, userRow) {
  req.session.userId = userRow.id;
  req.session.login = userRow.login;
  req.session.email = userRow.email;
  req.session.fullName = userRow.full_name;
  req.session.role = userRow.role;
}

router.get('/register', (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.render('auth/register', {
    title: 'Регистрация',
    fieldErrors: {},
    form: {},
  });
});

router.post('/register', async (req, res) => {
  const check = validateRegister(req.body);

  if (!check.valid) {
    return res.status(400).render('auth/register', {
      title: 'Регистрация',
      fieldErrors: check.fieldErrors,
      form: check.values,
    });
  }

  try {
    const hash = await bcrypt.hash(req.body.password, 10);
    const q = await pool.query(
      `INSERT INTO users (login, email, password_hash, full_name, phone, role)
       VALUES ($1, $2, $3, $4, $5, 'user')
       RETURNING id, login, email, full_name, role`,
      [check.values.login, check.values.email, hash, check.values.full_name, check.values.phone]
    );
    setSession(req, q.rows[0]);
    res.redirect('/');
  } catch (e) {
    const fieldErrors = {};
    const form = check.values;
    if (e.code === '23505') {
      if (e.constraint && e.constraint.includes('login')) {
        fieldErrors.login = 'Логин уже занят.';
      } else {
        fieldErrors.email = 'Email уже занят.';
      }
    } else {
      console.error(e);
      fieldErrors._form = 'Ошибка сервера.';
    }
    return res.status(400).render('auth/register', {
      title: 'Регистрация',
      fieldErrors,
      form,
    });
  }
});

router.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.render('auth/login', {
    title: 'Вход',
    fieldErrors: {},
    form: {},
    next: typeof req.query.next === 'string' ? req.query.next : '',
  });
});

router.post('/login', async (req, res) => {
  const check = validateLoginForm(req.body);
  const nextRaw = (req.body.next || '').toString();
  const nextUrl = nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/';

  if (!check.valid) {
    return res.status(400).render('auth/login', {
      title: 'Вход',
      fieldErrors: check.fieldErrors,
      form: check.values,
      next: nextRaw,
    });
  }

  try {
    const q = await pool.query(
      'SELECT id, login, email, password_hash, full_name, role FROM users WHERE login = $1',
      [check.values.login]
    );
    const userRow = q.rows[0];
    if (!userRow || !(await bcrypt.compare(req.body.password, userRow.password_hash))) {
      return res.status(400).render('auth/login', {
        title: 'Вход',
        fieldErrors: { login: 'Неверный логин или пароль.' },
        form: check.values,
        next: nextRaw,
      });
    }
    setSession(req, userRow);
    res.redirect(nextUrl);
  } catch (e) {
    console.error(e);
    res.status(500).render('auth/login', {
      title: 'Вход',
      fieldErrors: { _form: 'Ошибка сервера.' },
      form: check.values,
      next: nextRaw,
    });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
