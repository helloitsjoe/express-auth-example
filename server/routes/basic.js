/* eslint-disable camelcase */
const express = require('express');
const { generateRandom, makeResponse, ONE_HOUR_IN_SECONDS } = require('./utils');

const router = express.Router();

const tokens = new Set();

const handleLogin = ({ username, password }) => {
  const message = `Username: ${username} | Password: ${password}`;
  // TODO: Check password
  console.log(message);
  if (!username || !password) {
    return makeResponse({ message: 'Username and password are both required.', status: 401 });
  }
  const token = generateRandom(50);
  // TODO: Make expired error
  const expires_in = ONE_HOUR_IN_SECONDS;
  tokens.add(token);
  return makeResponse({ token, expires_in });
};

router.post('/login', (req, res) => {
  const { status, ...rest } = handleLogin(req.body);
  console.log(status, rest);
  res.status(status).json(rest);
});

router.post('/secure', (req, res) => {
  const { authorization } = req.headers;
  // TODO: Middleware for removing bearer and checking username/password
  const token = authorization && authorization.split('Bearer ')[1];
  if (!tokens.has(token)) {
    return res.status(403).json({ message: 'Unauthorized!' });
  }
  return res.json({ message: 'hi' });
});

module.exports = router;
