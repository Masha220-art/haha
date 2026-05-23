const express = require('express');
const { pool } = require('../db/pool');
const { requireAdmin } = require('../middleware/auth');
const { APPLICATION_STATUS, PAYMENT_METHOD, REVIEW_STATUS, formatDateRu } = require('../lib/labels');

const router = express.Router();
router.use(requireAdmin);

const STATUS_KEYS = ['new', 'in_progress', 'completed'];

router.get('/', (req, res) => {
  res.render('admin/dashboard', { title: 'Панель администратора' });
});

router.get('/applications', async (req, res) => {
  const st = req.query.status;
  let sql = `
    SELECT a.*, c.title AS course_title, u.login AS user_login, u.full_name AS user_name
    FROM applications a
    JOIN courses c ON c.id = a.course_id
    JOIN users u ON u.id = a.user_id
    ORDER BY a.created_at DESC
  `;
  const args = [];
  if (st && STATUS_KEYS.includes(st)) {
    sql = `
      SELECT a.*, c.title AS course_title, u.login AS user_login, u.full_name AS user_name
      FROM applications a
      JOIN courses c ON c.id = a.course_id
      JOIN users u ON u.id = a.user_id
      WHERE a.status = $1
      ORDER BY a.created_at DESC
    `;
    args.push(st);
  }
  const q = await pool.query(sql, args);
  res.render('admin/applications', {
    title: 'Все заявки',
    applicationList: q.rows,
    filterStatus: st || '',
    APPLICATION_STATUS,
    PAYMENT_METHOD,
    formatDateRu,
  });
});

router.post('/applications/:id/status', async (req, res) => {
  const id1 = parseInt(req.params.id, 10);
  const { status } = req.body;
  if (!STATUS_KEYS.includes(status)) {
    return res.redirect('/admin/applications');
  }
  await pool.query('UPDATE applications SET status = $1 WHERE id = $2', [status, id1]);
  res.redirect('/admin/applications');
});

router.get('/reviews', async (req, res) => {
  const filter1 = req.query.filter || 'pending';
  let where = "rv.moderation_status = 'pending'";
  if (filter1 === 'all') where = 'TRUE';
  if (filter1 === 'published') where = "rv.moderation_status = 'published'";
  if (filter1 === 'rejected') where = "rv.moderation_status = 'rejected'";

  const q = await pool.query(
    `SELECT rv.*, a.id AS application_ref, c.title AS course_title,
            u.login AS user_login, u.full_name AS user_name
     FROM reviews rv
     JOIN applications a ON a.id = rv.application_id
     JOIN courses c ON c.id = a.course_id
     JOIN users u ON u.id = rv.user_id
     WHERE ${where}
     ORDER BY rv.created_at DESC`
  );
  res.render('admin/reviews', {
    title: 'Модерация отзывов',
    reviewList: q.rows,
    filter1,
    REVIEW_STATUS,
  });
});

router.post('/reviews/:id/moderate', async (req, res) => {
  const id1 = parseInt(req.params.id, 10);
  const { action } = req.body;
  let mod = 'pending';
  if (action === 'publish') mod = 'published';
  else if (action === 'reject') mod = 'rejected';
  else return res.redirect('/admin/reviews');

  await pool.query('UPDATE reviews SET moderation_status = $1 WHERE id = $2', [mod, id1]);
  res.redirect('/admin/reviews');
});

module.exports = router;
