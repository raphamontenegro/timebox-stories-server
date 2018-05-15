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

const index = require('./routes/index');
const auth = require('./routes/auth');
const stories = require('./routes/stories');

const User = require('./models/user');

const app = express();

// ----------------- Mongooose --------------------//
mongoose.Promise = Promise;
mongoose.connect('mongodb://localhost/timeBox', {
  keepAlive: true,
  reconnectTries: Number.MAX_VALUE
});

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

const POCKET_CONSUMER_KEY = '77233-bc1d5f96390df6ad14c48477';

const options = {
  consumerKey: POCKET_CONSUMER_KEY,
  callbackURL: 'http://localhost:3000/auth/pocket/callback' // http changed
};
const pocketStrategy = new PocketStrategy(options, (username, accessToken, done) => {
  User.findOne({ pocketUsername: username }, (err, user) => {
    if (err) {
      return done(err);
    }
    if (user) {
      return done(null, user);
    }

    const newUser = new User({
      pocketUsername: username,
      pocketToken: accessToken
    });

    newUser.save(err => {
      if (err) {
        return done(err);
      }
      done(null, newUser);
    });
  });
});
passport.use(pocketStrategy);

app.use(passport.initialize());
app.use(passport.session());

// Middleware

app.use(
  cors({
    credentials: true,
    origin: ['http://localhost:4200']
  })
);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

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
    res.status(500).json({ code: 'unexpected' });
  }
});

module.exports = app;
