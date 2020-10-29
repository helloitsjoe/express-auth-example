/* eslint-disable camelcase */
const crypto = require('crypto');

const ONE_HOUR_IN_SECONDS = Math.floor(Date.now() / 1000) + 60 * 60;

const makeResponse = ({ message, token, status = 200 }) => ({
  message,
  status,
  token,
});

const generateRandom = len => {
  const rand = crypto
    .randomBytes(len)
    .toString('base64')
    .replace(/[/+=]/g, '')
    // length in bytes is greater than string length
    .slice(0, len);

  return rand;
};

const getSessionCookie = headers => {
  const KEY = 'connect.sid=s%3A';
  const [cookies] = headers['set-cookie'];
  const sessionId = cookies.split('; ').find(cookie => cookie.startsWith(KEY));
  return sessionId && sessionId.replace(KEY, '').split('.')[0];
};

module.exports = {
  ONE_HOUR_IN_SECONDS,
  getSessionCookie,
  generateRandom,
  makeResponse,
};