/* eslint-disable consistent-return */
/* eslint-disable camelcase */
const bcrypt = require('bcrypt');
const express = require('express');
const { generateRandom, makeResponse, getTokenExp } = require('../utils');

const router = express.Router();

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

  // Note: This will be a timestamp without a timezone. Better to use an ISO string.
  await users.insertOne({
    username,
    hash,
    token,
    expiration: Date.now() + getTokenExp() * 1000,
  });

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

  await users.updateOne(
    { username },
    { token, expiration: Date.now() + getTokenExp() * 1000 }
  );
  return makeResponse({ token });
};

const simpleTokenMiddleware = async (req, res, next) => {
  const { authorization } = req.headers;
  const { users } = req.db;
  const token = authorization && authorization.split('Bearer ')[1];
  const user = await users.findOne({ token });

  if (!user) {
    const error = new Error('Unauthorized!');
    error.statusCode = 403;
    return next(error);
  }

  if (user.expiration < Date.now()) {
    const error = new Error('Token is expired');
    error.statusCode = 403;
    return next(error);
  }

  req.user = user;
  next();
};

router.post('/signup', async (req, res) => {
  const { status, ...rest } = await handleSignUp(req.body, req.db);
  res.status(status).json(rest);
});

router.post('/login', async (req, res) => {
  const { status, ...rest } = await handleLogin(req.body, req.db);
  res.status(status).json(rest);
});

router.get('/login', simpleTokenMiddleware, (req, res) => {
  // TODO: Don't return the whole user, insecure
  res.json({ user: req.user });
});

router.post('/secure', simpleTokenMiddleware, async (req, res) => {
  return res.json({
    message: `Hello from simple-token auth, ${req.user.username}!`,
  });
});

router.post('/logout', async (req, res) => {
  // TODO: admin auth
  const { users } = req.db;
  const { token } = req.body;

  const user = await users.findOne({ token });

  if (!user) {
    return res.status(404).json({ message: 'Token not found!' });
  }

  const { username } = user;
  await users.updateOne({ username }, { token: null, expires_in: null });
  // const userAfter = await users.findOne({ token });

  return res.json({ token });
});

module.exports = router;
