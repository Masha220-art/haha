const express = require('express');
const { pool } = require('../db/pool');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAdmin);

router.get('/', (req, res) => {
  res.render('admin/dashboard', { title: 'Админ' });
});

router.get('/entries', async (req, res) => {
  const st = req.query.status;
  let sql = `
    SELECT e.*, i.title AS item_title, u.email AS user_email, u.full_name AS user_name
    FROM entries e
    JOIN items i ON i.id = e.item_id
    JOIN users u ON u.id = e.user_id
    ORDER BY e.created_at DESC
  `;
  const args = [];
  if (st && ['pending', 'approved', 'rejected', 'cancelled'].includes(st)) {
    sql = `
      SELECT e.*, i.title AS item_title, u.email AS user_email, u.full_name AS user_name
      FROM entries e
      JOIN items i ON i.id = e.item_id
      JOIN users u ON u.id = e.user_id
      WHERE e.status = $1
      ORDER BY e.created_at DESC
    `;
    args.push(st);
  }
  const q = await pool.query(sql, args);
  res.render('admin/entries', {
    title: 'Все записи',
    entryList: q.rows,
    filter1: st || '',
  });
});

router.post('/entries/:id/status', async (req, res) => {
  const id1 = parseInt(req.params.id, 10);
  const { status } = req.body;
  if (!['pending', 'approved', 'rejected', 'cancelled'].includes(status)) {
    return res.redirect('/admin/entries');
  }
  await pool.query('UPDATE entries SET status = $1 WHERE id = $2', [status, id1]);
  res.redirect('/admin/entries');
});

router.get('/ratings', async (req, res) => {
  const filter1 = req.query.filter || 'pending';
  let where = "rt.moderation_status = 'pending'";
  if (filter1 === 'all') where = 'TRUE';
  if (filter1 === 'published') where = "rt.moderation_status = 'published'";
  if (filter1 === 'rejected') where = "rt.moderation_status = 'rejected'";

  const q = await pool.query(
    `SELECT rt.*, e.id AS entry_ref, i.title AS item_title,
            u.email AS user_email, u.full_name AS user_name
     FROM ratings rt
     JOIN entries e ON e.id = rt.entry_id
     JOIN items i ON i.id = e.item_id
     JOIN users u ON u.id = rt.user_id
     WHERE ${where}
     ORDER BY rt.created_at DESC`
  );
  res.render('admin/ratings', {
    title: 'Оценки',
    ratingList: q.rows,
    filter1,
  });
});

router.post('/ratings/:id/moderate', async (req, res) => {
  const id1 = parseInt(req.params.id, 10);
  const { action } = req.body;
  let mod = 'pending';
  if (action === 'publish') mod = 'published';
  else if (action === 'reject') mod = 'rejected';
  else return res.redirect('/admin/ratings');

  await pool.query('UPDATE ratings SET moderation_status = $1 WHERE id = $2', [mod, id1]);
  res.redirect('/admin/ratings');
});

module.exports = router;
