'use strict';

const express = require('express');
const router = express.Router();

const pocketClient = require('../clients/pocket');

const Stories = require('../models/story');

/* GET home page. */

router.get('/', (req, res, next) => {
  const query = req.query.time;
  Stories.find({length: query})
    .then(result => {
      res.json(result);
    })
    .catch(next);
});

router.get('/pocket', (req, res, next) => {
  pocketClient.getRequestUrl(req.user.pocketToken)
    .then((data) => {
      res.status(200).json({ data });
    })
    .catch(next);
});

module.exports = router;
