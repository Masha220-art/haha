const express = require('express');
const { pool } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { validateApplication } = require('../lib/validation');
const { APPLICATION_STATUS, PAYMENT_METHOD, formatDateRu } = require('../lib/labels');

const router = express.Router();
router.use(requireAuth);

async function getApplication(id, uid) {
  const q = await pool.query(
    `SELECT a.*, c.title AS course_title
     FROM applications a
     JOIN courses c ON c.id = a.course_id
     WHERE a.id = $1 AND a.user_id = $2`,
    [id, uid]
  );
  return q.rows[0] || null;
}

router.get('/', async (req, res) => {
  const uid = req.session.userId;
  const q = await pool.query(
    `SELECT a.*, c.title AS course_title,
            rv.id AS review_id, rv.moderation_status AS review_mod
     FROM applications a
     JOIN courses c ON c.id = a.course_id
     LEFT JOIN reviews rv ON rv.application_id = a.id
     WHERE a.user_id = $1
     ORDER BY a.created_at DESC`,
    [uid]
  );
  res.render('applications/list', {
    title: 'Мои заявки',
    applicationList: q.rows,
    APPLICATION_STATUS,
  });
});

router.get('/new', async (req, res) => {
  const q = await pool.query('SELECT id, title FROM courses ORDER BY title');
  res.render('applications/form', {
    title: 'Новая заявка',
    mode: 'create',
    courseList: q.rows,
    form: { course_id: '', start_date: '', payment_method: '' },
    fieldErrors: {},
    PAYMENT_METHOD,
  });
});

router.post('/new', async (req, res) => {
  const uid = req.session.userId;
  const check = validateApplication(req.body);
  const q1 = await pool.query('SELECT id, title FROM courses ORDER BY title');

  if (!check.valid) {
    return res.status(400).render('applications/form', {
      title: 'Новая заявка',
      mode: 'create',
      courseList: q1.rows,
      form: check.values,
      fieldErrors: check.fieldErrors,
      PAYMENT_METHOD,
    });
  }

  try {
    await pool.query(
      `INSERT INTO applications (user_id, course_id, start_date, payment_method, status)
       VALUES ($1, $2, $3, $4, 'new')`,
      [uid, check.values.course_id, check.values.startDateIso, check.values.payment_method]
    );
    res.redirect('/applications');
  } catch (e) {
    console.error(e);
    res.status(500).render('applications/form', {
      title: 'Новая заявка',
      mode: 'create',
      courseList: q1.rows,
      form: check.values,
      fieldErrors: { _form: 'Не удалось сохранить заявку.' },
      PAYMENT_METHOD,
    });
  }
});

router.get('/:id', async (req, res) => {
  const uid = req.session.userId;
  const row = await getApplication(req.params.id, uid);
  if (!row) return res.status(404).render('error', { title: '404', message: 'Заявка не найдена.' });

  const q = await pool.query('SELECT * FROM reviews WHERE application_id = $1', [row.id]);
  res.render('applications/show', {
    title: 'Заявка #' + row.id,
    row,
    reviewRow: q.rows[0] || null,
    fieldErrors: {},
    APPLICATION_STATUS,
    PAYMENT_METHOD,
    formatDateRu,
  });
});

router.post('/:id/reviews', async (req, res) => {
  const uid = req.session.userId;
  const row = await getApplication(req.params.id, uid);
  if (!row) return res.status(404).render('error', { title: '404', message: 'Заявка не найдена.' });

  const fieldErrors = {};
  if (row.status !== 'completed') {
    fieldErrors._form = 'Отзыв доступен после завершения обучения.';
  }

  const q0 = await pool.query('SELECT id FROM reviews WHERE application_id = $1', [row.id]);
  if (q0.rows.length) {
    return res.redirect('/applications/' + row.id);
  }

  const n = parseInt(req.body.rating, 10);
  const text1 = (req.body.body || '').trim();
  if (!n || n < 1 || n > 5) fieldErrors.rating = 'Выберите оценку от 1 до 5.';
  if (!text1) fieldErrors.body = 'Введите текст отзыва.';

  if (Object.keys(fieldErrors).length) {
    const q2 = await pool.query('SELECT * FROM reviews WHERE application_id = $1', [row.id]);
    return res.status(400).render('applications/show', {
      title: 'Заявка #' + row.id,
      row,
      reviewRow: q2.rows[0] || null,
      fieldErrors,
      APPLICATION_STATUS,
      PAYMENT_METHOD,
      formatDateRu,
    });
  }

  try {
    await pool.query(
      `INSERT INTO reviews (application_id, user_id, rating, body, moderation_status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [row.id, uid, n, text1]
    );
    res.redirect('/applications/' + row.id);
  } catch (e) {
    console.error(e);
    res.status(500).render('applications/show', {
      title: 'Заявка #' + row.id,
      row,
      reviewRow: null,
      fieldErrors: { _form: 'Не удалось сохранить отзыв.' },
      APPLICATION_STATUS,
      PAYMENT_METHOD,
      formatDateRu,
    });
  }
});

module.exports = router;
