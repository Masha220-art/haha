const express = require('express');
const { pool } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

async function getEntry(id, uid) {
  const q = await pool.query(
    `SELECT e.*, i.title AS item_title, i.description AS item_desc
     FROM entries e
     JOIN items i ON i.id = e.item_id
     WHERE e.id = $1 AND e.user_id = $2`,
    [id, uid]
  );
  return q.rows[0] || null;
}

router.get('/', async (req, res) => {
  const uid = req.session.userId;
  const q = await pool.query(
    `SELECT e.*, i.title AS item_title,
            rt.id AS rating_id, rt.moderation_status AS rating_mod
     FROM entries e
     JOIN items i ON i.id = e.item_id
     LEFT JOIN ratings rt ON rt.entry_id = e.id
     WHERE e.user_id = $1
     ORDER BY e.created_at DESC`,
    [uid]
  );
  res.render('entries/list', {
    title: 'Мои записи',
    entryList: q.rows,
  });
});

router.get('/new', async (req, res) => {
  const q = await pool.query('SELECT id, title FROM items ORDER BY title');
  res.render('entries/form', {
    title: 'Новая запись',
    mode: 'create',
    itemList: q.rows,
    row: { item_id: '', note: '', status: 'pending' },
    err: null,
  });
});

router.post('/new', async (req, res) => {
  const uid = req.session.userId;
  const { item_id, note } = req.body;
  const q1 = await pool.query('SELECT id, title FROM items ORDER BY title');
  const itemList = q1.rows;

  if (!item_id) {
    return res.status(400).render('entries/form', {
      title: 'Новая запись',
      mode: 'create',
      itemList,
      row: { item_id, note: note || '' },
      err: 'Выберите позицию из списка.',
    });
  }

  try {
    await pool.query(
      `INSERT INTO entries (user_id, item_id, status, note)
       VALUES ($1, $2, 'pending', $3)`,
      [uid, item_id, (note || '').trim() || null]
    );
    res.redirect('/entries');
  } catch (e) {
    console.error(e);
    res.status(500).render('entries/form', {
      title: 'Новая запись',
      mode: 'create',
      itemList,
      row: { item_id, note: note || '' },
      err: 'Не сохранилось.',
    });
  }
});

router.get('/:id/edit', async (req, res) => {
  const uid = req.session.userId;
  const row = await getEntry(req.params.id, uid);
  if (!row) return res.status(404).render('error', { title: '404', message: 'Нет записи.' });
  if (row.status !== 'pending') {
    return res.status(400).render('error', {
      title: 'Нельзя',
      message: 'Редактирование только в статусе pending.',
    });
  }

  const q = await pool.query('SELECT id, title FROM items ORDER BY title');
  res.render('entries/form', {
    title: 'Правка записи',
    mode: 'edit',
    itemList: q.rows,
    row,
    err: null,
  });
});

router.post('/:id/edit', async (req, res) => {
  const uid = req.session.userId;
  const row = await getEntry(req.params.id, uid);
  if (!row) return res.status(404).render('error', { title: '404', message: 'Нет записи.' });
  if (row.status !== 'pending') {
    return res.redirect('/entries/' + row.id);
  }

  const { item_id, note } = req.body;
  const q1 = await pool.query('SELECT id, title FROM items ORDER BY title');
  const itemList = q1.rows;

  if (!item_id) {
    return res.status(400).render('entries/form', {
      title: 'Правка записи',
      mode: 'edit',
      itemList,
      row: { ...row, item_id, note },
      err: 'Выберите позицию.',
    });
  }

  try {
    await pool.query(
      `UPDATE entries SET item_id = $1, note = $2 WHERE id = $3 AND user_id = $4`,
      [item_id, (note || '').trim() || null, row.id, uid]
    );
    res.redirect('/entries/' + row.id);
  } catch (e) {
    console.error(e);
    res.status(500).render('entries/form', {
      title: 'Правка записи',
      mode: 'edit',
      itemList,
      row: { ...row, item_id, note },
      err: 'Ошибка сохранения.',
    });
  }
});

router.post('/:id/delete', async (req, res) => {
  const uid = req.session.userId;
  const row = await getEntry(req.params.id, uid);
  if (!row) return res.status(404).send('404');
  if (row.status !== 'pending') {
    return res.redirect('/entries/' + row.id);
  }
  await pool.query('DELETE FROM entries WHERE id = $1 AND user_id = $2', [row.id, uid]);
  res.redirect('/entries');
});

router.post('/:id/ratings', async (req, res) => {
  const uid = req.session.userId;
  const row = await getEntry(req.params.id, uid);
  if (!row) return res.status(404).render('error', { title: '404', message: 'Нет записи.' });

  if (row.status !== 'approved') {
    return res.status(400).render('entries/show', {
      title: 'Запись #' + row.id,
      row,
      ratingRow: null,
      errRating: 'Оценка доступна после approved.',
    });
  }

  const q0 = await pool.query('SELECT id FROM ratings WHERE entry_id = $1', [row.id]);
  if (q0.rows.length) {
    return res.redirect('/entries/' + row.id);
  }

  const n = parseInt(req.body.rating, 10);
  const text1 = (req.body.body || '').trim();
  if (!n || n < 1 || n > 5 || !text1) {
    const q2 = await pool.query('SELECT * FROM ratings WHERE entry_id = $1', [row.id]);
    return res.status(400).render('entries/show', {
      title: 'Запись #' + row.id,
      row,
      ratingRow: q2.rows[0] || null,
      errRating: 'Оценка 1–5 и текст.',
    });
  }

  try {
    await pool.query(
      `INSERT INTO ratings (entry_id, user_id, rating, body, moderation_status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [row.id, uid, n, text1]
    );
    res.redirect('/entries/' + row.id);
  } catch (e) {
    if (e.code === '23505') {
      return res.redirect('/entries/' + row.id);
    }
    console.error(e);
    res.status(500).render('entries/show', {
      title: 'Запись #' + row.id,
      row,
      ratingRow: null,
      errRating: 'Не сохранилось.',
    });
  }
});

router.get('/:id', async (req, res) => {
  const uid = req.session.userId;
  const row = await getEntry(req.params.id, uid);
  if (!row) return res.status(404).render('error', { title: '404', message: 'Нет записи.' });

  const q = await pool.query('SELECT * FROM ratings WHERE entry_id = $1', [row.id]);
  res.render('entries/show', {
    title: 'Запись #' + row.id,
    row,
    ratingRow: q.rows[0] || null,
    errRating: null,
  });
});

module.exports = router;
