const express = require('express');
const { pool } = require('../db/pool');

const router = express.Router();

router.get('/', async (req, res) => {
  let courseList = [];
  let listErr = null;
  try {
    const q = await pool.query(
      'SELECT id, title, description FROM courses ORDER BY id ASC'
    );
    courseList = q.rows;
  } catch (e) {
    console.error(e);
    if (e.code === '42P01') {
      listErr =
        'В базе нет таблицы courses. Выполните sql/schema.sql в вашей БД, затем npm run db:seed.';
    } else {
      listErr = e.message || String(e);
    }
  }
  res.render('index', {
    title: 'Главная',
    courseList,
    listErr,
  });
});

module.exports = router;
