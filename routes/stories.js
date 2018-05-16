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
  if (req.user) {
    pocketClient.getAllStories(req.user.pocketToken)
      .then((data) => {
        res.status(200).json({ data });
      })
      .catch(next);
  }
});

// server.get('/', function (req, res) {
//   console.log('Req to /');
//   if (req.user) {
//     pocketStrategy.getUnreadItems(req.user.accessToken, function (err, items) {
//       if (err) {
//         res.send('Something went wrong');
//         return;
//       }

//       res.render('index', {
//         user: req.user,
//         items: items
//       });
//     });
//   } else {
//     res.render('index', { user: req.user });
//   }
// });

module.exports = router;
