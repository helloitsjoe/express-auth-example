/**
 * @jest-environment node
 */
const axios = require('axios');
const makeAuthServer = require('../makeAuthServer');
const { makeTestDbApi } = require('../db');
const { getTokenExp, ONE_HOUR_IN_SECONDS } = require('../utils');

jest.mock('../utils', () => {
  return {
    ...jest.requireActual('../utils'),
    getTokenExp: jest.fn(),
  };
});

let db;
let err;
let server;
let rootUrl;

const getRootUrl = (port) => `http://localhost:${port}`;
const setError = (e) => {
  err = e;
};

beforeEach(async () => {
  getTokenExp.mockReturnValue(ONE_HOUR_IN_SECONDS);
  db = { users: makeTestDbApi() };
  // Passing port 0 to server assigns a random port
  server = await makeAuthServer(0, db);
  const { port } = server.address();
  rootUrl = getRootUrl(port);
});

afterEach((done) => {
  db = null;
  err = null;
  rootUrl = null;
  jest.clearAllMocks();
  server.close(done);
});

test('listens on given port', () => {
  const actualPort = server.address().port;
  expect(typeof actualPort).toBe('number');
});

describe('oauth', () => {
  it('oauth route returns oauth dialog', async () => {
    const res = await axios.get(`${rootUrl}/oauth`);
    const dataIsHTML = /<!DOCTYPE html>/.test(res.data);
    expect(dataIsHTML).toBe(true);
    expect(res.data).toMatch(/<button(.*)>Authorize<\/button>/i);
  });
});

describe('simple-token', () => {
  describe('/signup', () => {
    it('returns token for valid signup', async () => {
      const body = { username: 'foo', password: 'bar' };
      const res = await axios.post(`${rootUrl}/simple-token/signup`, body);
      expect(typeof res.data.token).toBe('string');
    });

    it('returns error if no username', async () => {
      const body = { password: 'bar' };
      await axios.post(`${rootUrl}/simple-token/signup`, body).catch(setError);
      expect(err.response.status).toBe(401);
      expect(err.response.data.message).toMatch(/username/i);
    });

    it('returns error if no password', async () => {
      const body = { username: 'bar' };
      await axios.post(`${rootUrl}/simple-token/signup`, body).catch(setError);
      expect(err.response.status).toBe(401);
      expect(err.response.data.message).toMatch(/password/i);
    });

    it('returns error if user already exists', async () => {
      const body = { username: 'foo', password: 'bar' };
      await axios.post(`${rootUrl}/simple-token/signup`, body);
      await axios.post(`${rootUrl}/simple-token/signup`, body).catch(setError);
      expect(err.response.status).toBe(401);
      expect(err.response.data.message).toMatch(/username already exists/i);
    });

    it('does not store plaintext password', async () => {
      const username = 'foo';
      const body = { username, password: 'bar' };
      await axios.post(`${rootUrl}/simple-token/signup`, body);
      const user = await db.users.findOne({ username });
      expect(typeof user.password).toBe('undefined');
      expect(typeof user.hash).toBe('string');
      expect(user.hash).not.toMatch(body.password);
    });
  });

  describe('/login', () => {
    describe('POST', () => {
      it('returns token for valid login', async () => {
        const body = { username: 'foo', password: 'bar' };
        await axios.post(`${rootUrl}/simple-token/signup`, body);
        const res = await axios.post(`${rootUrl}/simple-token/login`, body);
        expect(typeof res.data.token).toBe('string');
      });

      it('returns error if no username', async () => {
        expect.assertions(2);
        const body = { password: 'bar' };
        await axios.post(`${rootUrl}/simple-token/login`, body).catch(setError);
        expect(err.response.status).toBe(401);
        expect(err.response.data.message).toMatch(
          /username and password are both required/i
        );
      });

      it('returns error if no password', async () => {
        const body = { username: 'foo' };
        await axios.post(`${rootUrl}/simple-token/login`, body).catch(setError);
        expect(err.response.status).toBe(401);
        expect(err.response.data.message).toMatch(
          /username and password are both required/i
        );
      });

      it('returns error if password does not match', async () => {
        const body = { username: 'foo', password: 'bar' };
        await axios.post(`${rootUrl}/simple-token/signup`, body);
        const wrong = { username: 'foo', password: 'not-bar' };
        await axios
          .post(`${rootUrl}/simple-token/login`, wrong)
          .catch(setError);
        expect(err.response.status).toBe(401);
        expect(err.response.data.message).toMatch(
          /username and password do not match/i
        );
      });

      it('returns error if username does not exist', async () => {
        const body = { username: 'foo', password: 'bar' };
        await axios.post(`${rootUrl}/simple-token/login`, body).catch(setError);
        expect(err.response.status).toBe(401);
        expect(err.response.data.message).toMatch(
          /username foo does not exist/i
        );
      });
    });

    describe('GET', () => {
      it('returns token for valid login', async () => {
        const body = { username: 'foo', password: 'bar' };
        const { data } = await axios.post(
          `${rootUrl}/simple-token/signup`,
          body
        );
        const options = { headers: { Authorization: `Bearer ${data.token}` } };
        const res = await axios.get(`${rootUrl}/simple-token/login`, options);
        expect(res.data.user.username).toBe(body.username);
      });

      it('returns error for expired token', async () => {
        getTokenExp.mockReturnValue(-60 * 60);
        const body = { username: 'foo', password: 'bar' };
        const signup = await axios.post(`${rootUrl}/simple-token/signup`, body);
        const { token } = signup.data;

        expect(token).toMatch(/\w+/);
        const options = { headers: { Authorization: `Bearer ${token}` } };
        await axios
          .get(`${rootUrl}/simple-token/login`, options)
          .catch(setError);
        expect(err.response.data.message).toMatch(/expired/i);
      });
    });
  });

  describe('/secure', () => {
    it('authorized after signup', async () => {
      const body = { username: 'foo', password: 'bar' };
      const signup = await axios.post(`${rootUrl}/simple-token/signup`, body);
      const { token } = signup.data;

      expect(token).toMatch(/\w+/);
      const options = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.post(
        `${rootUrl}/simple-token/secure`,
        body,
        options
      );
      expect(res.data.message).toMatch('Hello from simple-token auth, foo!');
    });

    describe('after logging in', () => {
      let body;
      let token;

      beforeEach(async () => {
        body = { username: 'foo', password: 'bar' };
        await axios.post(`${rootUrl}/simple-token/signup`, body);
        const res = await axios.post(`${rootUrl}/simple-token/login`, body);
        token = res.data.token;
        expect(res.data.token).toMatch(/\w+/);
      });

      it('returns response if valid token', async () => {
        const options = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.post(
          `${rootUrl}/simple-token/secure`,
          body,
          options
        );
        expect(res.data.message).toMatch('Hello from simple-token auth, foo!');
      });

      it('returns error if no token', async () => {
        await axios
          .post(`${rootUrl}/simple-token/secure`, body)
          .catch(setError);
        expect(err.response.data.message).toMatch(/Unauthorized!/i);
      });

      it('returns error if invalid token', async () => {
        const options = { headers: { Authorization: `Bearer not-token` } };
        await axios
          .post(`${rootUrl}/simple-token/secure`, body, options)
          .catch(setError);
        expect(err.response.data.message).toMatch(/Unauthorized!/i);
      });

      // it('returns error if expired token', () => {
      //   console.log(`date.now:`, Date.now());
      //   jest.advanceTimersByTime(60 * 60 * 1000 + 1000);
      //   console.log(`date.now:`, Date.now());
      //   expect.assertions(2);
      //   const options = { headers: { Authorization: `Bearer ${token}` } };
      //   return axios.post(`${rootUrl}/simple-token/secure`, body, options).catch(err => {
      //     expect(err.response.data.message).toMatch(/Unauthorized!/i);
      //   });
      // });
    });
  });

  describe('/logout', () => {
    let body;
    let token;
    let options;

    beforeEach(async () => {
      body = { username: 'foo', password: 'bar' };
      const res = await axios.post(`${rootUrl}/simple-token/signup`, body);
      token = res.data.token;
      expect(res.data.token).toMatch(/\w+/);

      options = { headers: { Authorization: `Bearer ${token}` } };
      const secureRes = await axios.post(
        `${rootUrl}/simple-token/secure`,
        body,
        options
      );
      expect(secureRes.data.message).toMatch(/hello/i);
    });

    afterEach(() => {
      body = null;
      token = null;
    });

    it('revokes token with valid token', async () => {
      const revokedRes = await axios.post(`${rootUrl}/simple-token/logout`, {
        token,
      });
      expect(revokedRes.data.token).toBe(token);

      await axios
        .post(`${rootUrl}/simple-token/secure`, body, options)
        .catch(setError);
      expect(err.response.status).toBe(403);
      expect(err.response.data.message).toMatch(/unauthorized/i);
    });

    it('user is still in db', async () => {
      const revokedRes = await axios.post(`${rootUrl}/simple-token/logout`, {
        token,
      });
      expect(revokedRes.data.token).toBe(token);

      await axios.post(`${rootUrl}/simple-token/signup`, body).catch(setError);
      expect(err.response.status).toBe(401);
      expect(err.response.data.message).toMatch(/username already exists/i);
    });

    it('responds with 404 if user has alrady logged out', async () => {
      const revokedRes = await axios.post(`${rootUrl}/simple-token/logout`, {
        token,
      });
      expect(revokedRes.data.token).toBe(token);

      await axios
        .post(`${rootUrl}/simple-token/logout`, { token })
        .catch(setError);
      expect(err.response.status).toBe(404);
      expect(err.response.data.message).toMatch(/token not found/i);
    });

    it('responds with 404 if no token exists for username', async () => {
      await axios
        .post(`${rootUrl}/simple-token/logout`, { token: 'foo' })
        .catch(setError);
      expect(err.response.status).toBe(404);
      expect(err.response.data.message).toMatch(/token not found/i);
    });
  });
});
