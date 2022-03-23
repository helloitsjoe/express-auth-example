/* eslint-disable consistent-return */
/* eslint-disable camelcase */
const bcrypt = require('bcrypt');
const express = require('express');
const {
  generateRandom,
  makeResponse,
  ONE_HOUR_IN_SECONDS,
} = require('../utils');

const router = express.Router();

const TOKEN_EXPIRATION = process.env.TOKEN_EXPIRATION || ONE_HOUR_IN_SECONDS;
const SALT_ROUNDS = 1;

const handleSignUp = async ({ username, password }, db) => {
  const { users } = db;
  if (!username || !password) {
    return makeResponse({
      message: 'Username and password are both required.',
      status: 401,
    });
  }

  const user = await users.findOne({ username });

  if (user) {
    return makeResponse({ message: 'Username already exists', status: 401 });
  }

  const hash = await bcrypt.hash(password, SALT_ROUNDS).catch(console.error);
  const token = generateRandom(50);

  await users.insertOne({
    username,
    hash,
    token,
    expires_in: TOKEN_EXPIRATION,
  });

  // const session = { user };

  return makeResponse({ token });
};

const handleLogin = async ({ username, password }, db) => {
  const { users } = db;
  if (!username || !password) {
    return makeResponse({
      message: 'Username and password are both required.',
      status: 401,
    });
  }

  const user = await users.findOne({ username });

  if (!user) {
    // TODO: Don't return messages like this to the client (insecure)
    return makeResponse({
      message: `Username ${username} does not exist`,
      status: 401,
    });
  }

  const valid = await bcrypt.compare(password, user.hash);

  if (!valid) {
    return makeResponse({
      message: 'Username and password do not match',
      status: 401,
    });
  }
  const token = generateRandom(50);
  // TODO: Make expired error
  await users.updateOne({ username }, { token, expires_in: TOKEN_EXPIRATION });
  return makeResponse({ token });
};

const makeError = (status = 401, message = 'Unauthorized!') => {
  const error = new Error(message);
  error.statusCode = status;
  return error;
};

const sessionMiddleware = async (req, res, next) => {
  // req.session is set from cookie in expressSession
  if (!req.session.user) return next(makeError());

  req.sessionStore.get(req.session.id, async (err, session) => {
    if (err) return next(err);
    if (!session) return next(makeError());

    const user = await req.db.users.findOne({ token: session.user });

    if (!user) return next(makeError(404, 'User not found'));

    req.user = user;
    next();
  });
};

router.post('/signup', async (req, res, next) => {
  const { status, ...rest } = await handleSignUp(req.body, req.db);
  req.session.user = rest.token;
  req.sessionStore.set(req.session.id, req.session, (err) => {
    if (err) next(err);
    res.status(status).json(rest);
  });
});

router.post('/login', async (req, res, next) => {
  const { status, ...rest } = await handleLogin(req.body, req.db);
  req.session.user = rest.token;
  req.sessionStore.set(req.session.id, req.session, (err) => {
    if (err) next(err);
    res.status(status).json(rest);
  });
});

router.get('/login', sessionMiddleware, (req, res) => {
  // TODO: Don't return the whole user object (insecure)
  return res.json({ user: req.user });
});

router.post('/secure', sessionMiddleware, async (req, res) => {
  return res.json({
    message: `Hello from session auth, ${req.user.username}!`,
  });
});

router.post('/logout', async (req, res) => {
  // TODO: admin auth
  const { cookie } = req.headers;
  if (!cookie) {
    return res.status(401).json({ message: 'No Session ID provided' });
  }

  req.sessionStore.destroy(req.session.id, (err) => {
    if (err) return res.status(500).json({ message: err.message });
    return res.json({ message: 'You have been logged out' });
  });
});

module.exports = router;
