/* eslint-disable camelcase */
const crypto = require('crypto');

const ONE_HOUR_IN_SECONDS = 60 * 60;

const getTokenExp = () => {
  return process.env.TOKEN_EXPIRATION || ONE_HOUR_IN_SECONDS;
};

const makeResponse = ({ message, token, status = 200 }) => ({
  message,
  status,
  token,
});

const generateRandom = (len) => {
  const rand = crypto
    .randomBytes(len)
    .toString('base64')
    .replace(/[/+=]/g, '')
    // length in bytes is greater than string length
    .slice(0, len);

  return rand;
};

const getCookie = (res) => {
  const [cookie] = res.headers['set-cookie'] || [];
  return cookie;
};

module.exports = {
  ONE_HOUR_IN_SECONDS,
  getCookie,
  getTokenExp,
  generateRandom,
  makeResponse,
};
