'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const passport = require('passport');

const User = require('../models/user');

router.get('/me', (req, res, next) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(404).json({ code: 'not-found' });
  }
});

router.post('/signup', (req, res, next) => {
  if (req.user) {
    return res.status(401).json({ code: 'unauthorized' });
  }

  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(422).json({ code: 'validation' });
  }

  User.findOne({ username }, 'username')
    .then((userExists) => {
      if (userExists) {
        return res.status(422).json({ code: 'username-not-unique' });
      }

      const salt = bcrypt.genSaltSync(10);
      const hashPass = bcrypt.hashSync(password, salt);

      const newUser = User({
        username,
        email,
        password: hashPass
      });

      return newUser.save()
        .then(() => {
          passport.authenticate('local')(req, res, function () {
            res.json(req.user);
          });
        });
    })
    .catch(next);
});

// router.post('/login', (req, res, next) => {
//   if (req.session.currentUser) {
//     return res.status(401).json({ code: 'unauthorized' });
//   }

//   const username = req.body.username;
//   const password = req.body.password;

//   if (!username || !password) {
//     return res.status(422).json({ code: 'validation' });
//   }

//   User.findOne({ username })
//     .then((user) => {
//       if (!user) {
//         return res.status(404).json({ code: 'not-found' });
//       }
//       if (!bcrypt.compareSync(password, user.password)) {
//         return res.status(404).json({ code: 'not-found' });
//       } else {
//         req.session.currentUser = user;
//         return res.json(user);
//       }
//     })
//     .catch(next);
// });

router.get('/login/success', (req, res, next) => {
  if (req.user) {
    return res.json(req.user);
  }
});

router.get('/login/failure', (req, res, next) => {
  return res.status(404).json({ code: 'not-found' });
});

// router.post('/login', passport.authenticate('local', {
//   successRedirect: '/auth/login/success',
//   failureRedirect: '/auth/login/failure',
//   failureFlash: false,
//   passReqToCallback: true
// }));

router.post('/login',
  passport.authenticate('local'),
  function (req, res) {
    return res.json(req.user);
  }
);

router.post('/logout', (req, res) => {
  req.logout();
  return res.status(204).json({code: 'ok'});
});

// ---------------- Passport authorizations ----------------//

router.get('/pocket', passport.authenticate('pocket'),
  function (req, res) {
    return res.json(req.user);
  });

router.get('/pocket/callback', passport.authenticate('pocket', { failureRedirect: '/login' }),
  function (req, res) {
    return res.json(req.user);
  });

module.exports = router;
