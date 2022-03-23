/**
 * @jest-environment node
 */
const axios = require('axios');
const makeAuthServer = require('../makeAuthServer');
const { makeTestDbApi } = require('../db');
const { getCookie, getTokenExp, ONE_HOUR_IN_SECONDS } = require('../utils');

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
  server.close(done);
  jest.clearAllMocks();
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

describe('session', () => {
  describe('/signup', () => {
    it('returns session ID for valid signup', async () => {
      const body = { username: 'foo', password: 'bar' };
      const res = await axios.post(`${rootUrl}/session/signup`, body);
      const sessionIdCookie = getCookie(res);
      expect(typeof sessionIdCookie).toBe('string');
    });

    it('returns error if no username', async () => {
      const body = { password: 'bar' };
      await axios.post(`${rootUrl}/session/signup`, body).catch(setError);
      expect(err.response.status).toBe(401);
      expect(err.response.data.message).toMatch(/username/i);
    });

    it('returns error if no password', async () => {
      const body = { username: 'bar' };
      await axios.post(`${rootUrl}/session/signup`, body).catch(setError);
      expect(err.response.status).toBe(401);
      expect(err.response.data.message).toMatch(/password/i);
    });

    it('returns error if user already exists', async () => {
      const body = { username: 'foo', password: 'bar' };
      await axios.post(`${rootUrl}/session/signup`, body);
      await axios.post(`${rootUrl}/session/signup`, body).catch(setError);
      expect(err.response.status).toBe(401);
      expect(err.response.data.message).toMatch(/username already exists/i);
    });

    it('does not store plaintext password', async () => {
      const username = 'foo';
      const body = { username, password: 'bar' };
      await axios.post(`${rootUrl}/session/signup`, body);
      const user = await db.users.findOne({ username });
      expect(typeof user.password).toBe('undefined');
      expect(typeof user.hash).toBe('string');
      expect(user.hash).not.toMatch(body.password);
    });
  });

  describe('/login', () => {
    describe('POST', () => {
      it('returns session ID for valid login', async () => {
        const body = { username: 'foo', password: 'bar' };
        await axios.post(`${rootUrl}/session/signup`, body);
        const res = await axios.post(`${rootUrl}/session/login`, body);
        expect(getCookie(res)).toMatch(/connect.sid=/);
      });

      it('returns error if no username', async () => {
        expect.assertions(2);
        const body = { password: 'bar' };
        await axios.post(`${rootUrl}/session/login`, body).catch(setError);
        expect(err.response.status).toBe(401);
        expect(err.response.data.message).toMatch(
          /username and password are both required/i
        );
      });

      it('returns error if no password', async () => {
        const body = { username: 'foo' };
        await axios.post(`${rootUrl}/session/login`, body).catch(setError);
        expect(err.response.status).toBe(401);
        expect(err.response.data.message).toMatch(
          /username and password are both required/i
        );
      });

      it('returns error if password does not match', async () => {
        const body = { username: 'foo', password: 'bar' };
        await axios.post(`${rootUrl}/session/signup`, body);
        const wrong = { username: 'foo', password: 'not-bar' };
        await axios.post(`${rootUrl}/session/login`, wrong).catch(setError);
        expect(err.response.status).toBe(401);
        expect(err.response.data.message).toMatch(
          /username and password do not match/i
        );
      });

      it('returns error if username does not exist', async () => {
        const body = { username: 'foo', password: 'bar' };
        await axios.post(`${rootUrl}/session/login`, body).catch(setError);
        expect(err.response.status).toBe(401);
        expect(err.response.data.message).toMatch(
          /username foo does not exist/i
        );
      });
    });

    describe('GET', () => {
      it('returns username for valid cookie', async () => {
        const body = { username: 'foo', password: 'bar' };
        const signup = await axios.post(`${rootUrl}/session/signup`, body);
        const cookie = getCookie(signup);

        const options = { headers: { cookie } };
        const res = await axios.get(`${rootUrl}/session/login`, options);
        expect(res.data.user.username).toBe(body.username);
      });

      it('returns error for expired cookie', (done) => {
        getTokenExp.mockReturnValue(ONE_HOUR_IN_SECONDS * -1);

        server.close(async () => {
          server = await makeAuthServer(0, db);
          const { port } = server.address();
          rootUrl = getRootUrl(port);

          const body = { username: 'foo', password: 'bar' };
          const signup = await axios.post(`${rootUrl}/session/signup`, body);
          const cookie = getCookie(signup);

          const options = { headers: { cookie } };
          await axios.get(`${rootUrl}/session/login`, options).catch(setError);
          expect(err.response.data.message).toMatch(/unauthorized/i);
          done();
        });
      });
    });
  });

  describe('/secure', () => {
    it('authorized after signup', async () => {
      const body = { username: 'foo', password: 'bar' };
      const signup = await axios.post(`${rootUrl}/session/signup`, body);
      const cookie = getCookie(signup);

      const options = { headers: { cookie } };
      const res = await axios.post(`${rootUrl}/session/secure`, body, options);
      expect(res.data.message).toMatch('Hello from session auth, foo!');
    });

    describe('after logging in', () => {
      let body;
      let cookie;

      beforeEach(async () => {
        body = { username: 'foo', password: 'bar' };
        await axios.post(`${rootUrl}/session/signup`, body);
        const res = await axios.post(`${rootUrl}/session/login`, body);
        cookie = getCookie(res);
        expect(res.data.token).toMatch(/\w+/);
      });

      it('returns response if valid session', async () => {
        const options = { headers: { cookie } };
        const res = await axios.post(
          `${rootUrl}/session/secure`,
          body,
          options
        );
        expect(res.data.message).toMatch('Hello from session auth, foo!');
      });

      it('returns error if no cookie', async () => {
        await axios.post(`${rootUrl}/session/secure`, body).catch(setError);
        expect(err.response.data.message).toMatch(/Unauthorized!/i);
      });

      it('returns error if invalid cookie', async () => {
        const options = { headers: { cookie: 'connect.sid=not-right' } };
        await axios
          .post(`${rootUrl}/session/secure`, body, options)
          .catch(setError);
        expect(err.response.data.message).toMatch(/Unauthorized!/i);
      });

      // it('returns error if expired token', () => {
      //   console.log(`date.now:`, Date.now());
      //   jest.advanceTimersByTime(60 * 60 * 1000 + 1000);
      //   console.log(`date.now:`, Date.now());
      //   expect.assertions(2);
      //   const options = { headers: { Authorization: `Bearer ${token}` } };
      //   return axios.post(`${rootUrl}/session/secure`, body, options).catch(err => {
      //     expect(err.response.data.message).toMatch(/Unauthorized!/i);
      //   });
      // });
    });
  });

  describe('/logout', () => {
    let body;
    let cookie;
    let options;

    beforeEach(async () => {
      body = { username: 'foo', password: 'bar' };
      const res = await axios.post(`${rootUrl}/session/signup`, body);
      cookie = getCookie(res);
      expect(cookie).toMatch(/connect.sid=/);

      options = { headers: { cookie } };
      const secureRes = await axios.post(
        `${rootUrl}/session/secure`,
        body,
        options
      );
      expect(secureRes.data.message).toMatch(/hello/i);
    });

    afterEach(() => {
      body = null;
      cookie = null;
    });

    it('revokes token with valid cookie', async () => {
      const revokedRes = await axios.post(
        `${rootUrl}/session/logout`,
        {},
        options
      );
      expect(revokedRes.data.message).toMatch(/logged out/i);

      await axios
        .post(`${rootUrl}/session/secure`, body, options)
        .catch(setError);
      expect(err.response.status).toBe(401);
      expect(err.response.data.message).toMatch(/unauthorized/i);
    });

    it('user is still in db', async () => {
      const revokedRes = await axios.post(
        `${rootUrl}/session/logout`,
        {},
        options
      );
      expect(revokedRes.data.message).toMatch(/logged out/i);

      await axios.post(`${rootUrl}/session/signup`, body).catch(setError);
      expect(err.response.status).toBe(401);
      expect(err.response.data.message).toMatch(/username already exists/i);
    });

    it('responds with 401 if no cookie provided', async () => {
      await axios.post(`${rootUrl}/session/logout`, {}, {}).catch(setError);
      expect(err.response.status).toBe(401);
      expect(err.response.data.message).toMatch(/no session id provided/i);
    });
  });
});
