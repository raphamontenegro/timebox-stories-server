'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const request = require('request');
const passport = require('passport');

const router = express.Router();

const User = require('../models/user');

const POCKET_CONSUMER_KEY = '77233-bc1d5f96390df6ad14c48477';

const formDataToJson = function (formData) {
  const json = {};

  formData.split('&').forEach(function (item) {
    const itemKey = item.split('=')[0];
    const itemValue = item.split('=')[1];

    json[itemKey] = itemValue;
  });

  return json;
};

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
  req.logout();
  return res.status(204).json({ code: 'ok' });
});

// ---------------- Passport authorizations ----------------//

router.get('/pocket', (req, res, next) => {
  const callbackURL = 'localhost:3000/auth/pocket/callback';

  request.post({
    'headers': { 'content-type': 'application/x-www-form-urlencoded' },
    'url': 'https://getpocket.com/v3/oauth/request',
    'form': {
      'consumer_key': POCKET_CONSUMER_KEY,
      'redirect_uri': callbackURL
    }
  }, function (error, response, body) {
    if (error) { next(error); }

    const data = formDataToJson(body);
    const url = `https://getpocket.com/auth/authorize?request_token=${data.code}&redirect_uri=${callbackURL}`;

    res.status(200).json({ url });
  });
});

// @note special route: this is the OAuth callback so it needs to respond with a redirect back to our frontend
router.get('/pocket/callback', (req, res, next) => {
  passport.authenticate('pocket', (error, user, info) => {
    if (error) {
      console.log(error);
      return res.redirect('http://localhost:4200/login');
    }
    res.redirect('http://localhost:4200/stories');
  });
});

module.exports = router;
