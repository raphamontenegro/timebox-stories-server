'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');

const router = express.Router();

const pocketClient = require('../clients/pocket');
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

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (error, user, info) => {
    if (error) {
      return next(error);
    }
    if (!user) {
      return res.status(401).json(info);
    }
    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      res.json(user);
    });
  })(req, res, next);
});

router.post('/logout', (req, res) => {
  delete req.session.pocketCode;
  delete req.session.pocketData;
  req.logout();
  return res.status(204).json({ code: 'ok' });
});

// ---------------- Passport authorizations ----------------//

// @note invoke by angular authService.loginPocket() expects a url bacl
router.get('/pocket', (req, res, next) => {
  pocketClient.getRequestUrl()
    .then((url) => {
      res.status(200).json({ url });
    })
    .catch(next);
});

// @note special route: this is the OAuth callback so it needs to respond with a redirect back to our frontend
router.get('/pocket/callback', (req, res, next) => {
  req.isPocketCallback = true;
  var fn = passport.authenticate('pocket', (err, user) => {
    if (err) {
      console.error('/pocket/callback after login', err);
      return res.redirect('http://localhost:4200/login?error=authenticate');
    }
    req.login(user, (err) => {
      if (err) {
        console.error('/pocket/callback after login', err);
        return res.redirect('http://localhost:4200/login?error=login');
      }
      res.redirect('http://localhost:4200/stories');
    });
  });

  fn(req, res, next);
});

router.get('/pocket/callback', (req, res, next) => {
  delete req.session.pocketCode;
  delete req.session.pocketData;
  console.error('/pocket/callback code reuse');
  return res.redirect('http://localhost:4200/login?error=code');
});

module.exports = router;
