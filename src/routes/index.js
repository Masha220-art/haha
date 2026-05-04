const express = require('express');
const { pool } = require('../db/pool');

const router = express.Router();

router.get('/', async (req, res) => {
  let itemList = [];
  let listErr = null;
  try {
    const q = await pool.query(
      'SELECT id, title, description FROM items ORDER BY id ASC'
    );
    itemList = q.rows;
  } catch (e) {
    console.error(e);
    if (e.code === '42P01') {
      listErr =
        'В базе нет таблицы items. Откройте sql/schema.sql в pgAdmin (или psql), выполните скрипт целиком в вашей БД, затем снова npm run db:seed.';
    } else {
      listErr = e.message || String(e);
    }
  }
  res.render('index', {
    title: 'Главная',
    itemList,
    listErr,
  });
});

module.exports = router;
