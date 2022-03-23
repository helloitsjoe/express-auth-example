/**
 * @jest-environment node
 */
const axios = require('axios');
const makeServer = require('../makeServer');
const makeAuthServer = require('../makeAuthServer');
require('dotenv').config();

const PORT = 1234;
const rootUrl = `http://localhost:${PORT}`;

let server;
beforeAll(async () => {
  server = await makeServer(PORT);
});

afterAll((done) => {
  server.close(done);
});

test('listens on given port', () => {
  const actualPort = server.address().port;
  expect(actualPort).toBe(PORT);
});

// Moving index.html to makeAuthServer, but leaving this here
// for after potential cross-domain cookies fix
test.skip('index route returns index.html', async () => {
  const res = await axios.get(rootUrl).catch((err) => console.error(err));
  const dataIsHTML = /<!DOCTYPE html>/.test(res.data);
  expect(dataIsHTML).toBe(true);
});

test('authServer index route returns index.html', async () => {
  const AUTH_PORT = 1235;
  const authServer = await makeAuthServer(AUTH_PORT);
  const res = await axios
    .get(`http://localhost:${AUTH_PORT}`)
    .catch((err) => console.error(err));
  const dataIsHTML = /<!DOCTYPE html>/.test(res.data);
  expect(dataIsHTML).toBe(true);
  authServer.close();
});
