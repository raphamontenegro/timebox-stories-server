'use strict';

const express = require('express');
const router = express.Router();

const Stories = require('../models/story');

/* GET home page. */
router.get('/', (req, res, next) => {
  res.status(200).json({ title: 'Welcome to timeBox server' });
});

router.get('/stories', (req, res, next) => {
  const query = req.query.time;
  Stories.find({length: query})
    .then(result => {
      res.json(result);
    })
    .catch(next);
});
module.exports = router;
