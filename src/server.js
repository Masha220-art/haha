require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { pool } = require('./db/pool');

const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const entriesRoutes = require('./routes/entries');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(
  session({
    store: new pgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: true,
    }),
    name: 'app.sid',
    secret: process.env.SESSION_SECRET || 'dev-only-change-in-env',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'lax',
    },
  })
);

app.use((req, res, next) => {
  res.locals.userData = req.session.userId
    ? {
        id: req.session.userId,
        email: req.session.email,
        fullName: req.session.fullName,
        role: req.session.role,
      }
    : null;
  next();
});

app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/entries', entriesRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).render('error', { title: '404', message: 'Страница не найдена.' });
});

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).render('error', {
    title: 'Ошибка',
    message: 'Внутренняя ошибка.',
  });
});

app.listen(PORT, () => {
  console.log('http://localhost:' + PORT);
});
