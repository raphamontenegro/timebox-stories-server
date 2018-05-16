'use strict';

// @todo dotenv
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const bcrypt = require('bcrypt');
const PocketStrategy = require('passport-pocket');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
require('dotenv').config();

const index = require('./routes/index');
const auth = require('./routes/auth');
const stories = require('./routes/stories');

const User = require('./models/user');

const app = express();

// ----------------- Mongooose --------------------//
mongoose.Promise = Promise;
mongoose.connect(process.env.MONGODB_URI, {
  keepAlive: true,
  reconnectTries: Number.MAX_VALUE
});

// Middleware

app.use(
  cors({
    credentials: true,
    origin: [process.env.CLIENT_URL]
  })
);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ----------------- Session --------------------//

app.use(
  session({
    store: new MongoStore({
      mongooseConnection: mongoose.connection,
      ttl: 24 * 60 * 60
    }),
    secret: 'some-string',
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

// ----------------- Passport configuration --------------------//

passport.use(new LocalStrategy((username, password, done) => {
  User.findOne({ username: username }, (err, user) => {
    if (err) { return done(err); }
    if (!user) {
      return done(null, false, { code: 'incorrect' });
    }
    if (!bcrypt.compareSync(password, user.password)) {
      return done(null, false, { code: 'incorrect' });
    }
    return done(null, user);
  });
}));

// Passport Set serializers
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

const options = {
  consumerKey: process.env.POCKET_CONSUMER_KEY,
  callbackURL: process.env.POCKET_CALLBACK_URL
};
const pocketStrategy = new PocketStrategy(options, (username, accessToken, done) => {
  User.findOne({ email: decodeURIComponent(username) }, (err, user) => {
    if (err) {
      return done(err);
    }
    if (user) {
      user.pocketToken = accessToken;
      user.save();
      return done(null, user);
    }

    const newUser = new User({
      username: decodeURIComponent(username),
      email: decodeURIComponent(username),
      pocketUsername: decodeURIComponent(username),
      pocketToken: accessToken
    });

    newUser.save(err => {
      if (err) {
        console.error(err);
        return done(err);
      }
      done(null, newUser);
    });
  });
});
passport.use(pocketStrategy);

app.use(passport.initialize());
app.use(passport.session());

app.use('/', index);
app.use('/auth', auth);
app.use('/stories', stories);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  res.status(404).json({ code: 'not-found' });
});

app.use((err, req, res, next) => {
  // always log the error
  console.error('ERROR', req.method, req.path, err);

  // only render if the error ocurred before sending the response
  if (!res.headersSent) {
    if (req.isPocketCallback) {
      delete req.session.pocketCode;
      delete req.session.pocketData;
      console.error('/pocket/callback global error handler', err);
      return res.redirect(`${process.env.CLIENT_URL}/login?error=unexpected`);
    }

    res.status(500).json({ code: 'unexpected' });
  }
});

module.exports = app;
