// This example is based on http://thecodebarbarian.com/oauth-with-node-js-and-express.html
const express = require('express');
const path = require('path');
const { generateRandom, ONE_DAY_IN_SECONDS } = require('../utils');

// Store codes and tokens in memory. In a real server this would use a DB
const authCodes = new Set();
const accessTokens = new Set();

const router = express.Router();

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public', 'oauth-dialog.html'));
});

router.get('/code', (req, res) => {
  console.log('getting code...');
  const authCode = generateRandom(10);

  authCodes.add(authCode);

  // Normally this would use a `redirect_uri` parameter
  res.redirect(`http://localhost:3001/oauth-callback.html?code=${authCode}`);
});

router.post('/token', (req, res) => {
  console.log(`generating token...`);
  const { code } = req.body;
  if (authCodes.has(code)) {
    const token = generateRandom(50);

    authCodes.delete(code);
    accessTokens.add(token);

    // Where do we set this to expire?
    return res.json({ access_token: token, expires_in: ONE_DAY_IN_SECONDS });
  }
  return res.status(400).json({ message: 'Invalid auth token' });
});

router.post('/secure', (req, res) => {
  const authorization = req.get('authorization');
  if (!accessTokens.has(authorization)) {
    return res.status(403).json({ message: 'Unauthorized!' });
  }
  const { message } = req.body;
  console.log('secure message', message);
  return res.json({ message: `${message} right back atcha` });
});

module.exports = router;
