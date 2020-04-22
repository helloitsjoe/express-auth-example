const express = require('express');
// const expressJWT = require('express-jwt');
const jwt = require('jsonwebtoken');
const { ONE_HOUR_IN_SECONDS, makeResponse } = require('./utils');

const router = express.Router();

// TODO: Signup

const handleLogin = ({ username, password }) => {
  const message = `Username: ${username} | Password: ${password}`;
  // TODO: Check password
  console.log(message);
  if (!username || !password) {
    return makeResponse({ message: 'Username and password are both required.', status: 401 });
  }
  const token = jwt.sign({ username, exp: ONE_HOUR_IN_SECONDS }, 'mysecret');
  return makeResponse({ token });
};

router.post('/login', (req, res) => {
  const { status, ...rest } = handleLogin(req.body);
  console.log(status, rest);
  res.status(status).json(rest);
});

router.post('/secure', (req, res) => {
  try {
    const token = req.headers.authorization.split('Bearer ')[1];
    const decoded = jwt.verify(token, 'mysecret');
    return res.json({ message: `Hi from JWT, ${decoded.username}!` });
  } catch (err) {
    console.error('Error verifying token:', err);
    return res.status(403).json({ message: `Unauthorized! ${err.message}` });
  }
});

module.exports = router;
