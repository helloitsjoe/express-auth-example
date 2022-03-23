/**
 * @jest-environment node
 */
const axios = require('axios');
const makeAuthServer = require('../makeAuthServer');
const { makeTestDbApi } = require('../db');
const { getTokenExp } = require('../utils');

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

const jwtRegEx = new RegExp(
  /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/
);

const getRootUrl = (port) => `http://localhost:${port}`;
const setError = (e) => {
  err = e;
};

beforeEach(async () => {
  db = { users: makeTestDbApi() };
  // Passing port 0 to server assigns a random port
  server = await makeAuthServer(0, db);
  const { port } = server.address();
  rootUrl = getRootUrl(port);
  getTokenExp.mockReturnValue('1h');
});

afterEach((done) => {
  server.close(done);
  jest.clearAllMocks();
});

describe('jwt', () => {
  describe('/signup', () => {
    it('returns token', async () => {
      const body = { username: 'foo', password: 'bar' };
      const res = await axios.post(`${rootUrl}/jwt/signup`, body);
      expect(res.data.token).toMatch(jwtRegEx);
    });

    it('returns error if username exists', async () => {
      const body = { username: 'first', password: 'bar' };
      await axios.post(`${rootUrl}/jwt/signup`, body);
      await axios.post(`${rootUrl}/jwt/signup`, body).catch(setError);
      expect(err.response.data.message).toMatch(/unavailable/i);
    });

    it('does not store password as plaintext', async () => {
      const username = 'first';
      const body = { username, password: 'bar' };
      await axios.post(`${rootUrl}/jwt/signup`, body);
      const user = await db.users.findOne({ username });
      expect(typeof user.password).toBe('undefined');
      expect(typeof user.hash).toBe('string');
      expect(user.hash).not.toBe(body.password);
    });
  });

  describe('/login', () => {
    describe('POST', () => {
      it('returns token', async () => {
        const body = { username: 'foo', password: 'bar' };
        await axios.post(`${rootUrl}/jwt/signup`, body);
        const res = await axios.post(`${rootUrl}/jwt/login`, body);
        expect(res.data.token).toMatch(jwtRegEx);
      });

      it('returns error if user does not exist', async () => {
        const body = { username: 'nobody', password: 'bar' };
        await axios.post(`${rootUrl}/jwt/login`, body).catch(setError);
        expect(err.response.data.message).toMatch(/does not exist/i);
      });

      it('returns error if password does not match', async () => {
        const body = { username: 'foo', password: 'bar' };
        await axios.post(`${rootUrl}/jwt/signup`, body);
        const wrong = { ...body, password: 'wrong-password' };
        await axios.post(`${rootUrl}/jwt/login`, wrong).catch(setError);
        expect(err.response.data.message).toMatch(/wrong password/i);
      });
    });

    describe('GET', () => {
      it('returns user if token is valid', async () => {
        const body = { username: 'foo', password: 'bar' };
        const { data } = await axios.post(`${rootUrl}/jwt/signup`, body);
        const options = { headers: { Authorization: `Bearer ${data.token}` } };
        const res = await axios.get(`${rootUrl}/jwt/login`, options);
        expect(res.data.user.username).toMatch(body.username);
      });

      it('returns error if expired token', async () => {
        getTokenExp.mockReturnValue('-1h');
        const body = { username: 'foo', password: 'bar' };
        const { data } = await axios.post(`${rootUrl}/jwt/signup`, body);
        const options = { headers: { Authorization: `Bearer ${data.token}` } };
        await axios.get(`${rootUrl}/jwt/login`, options).catch(setError);
        expect(err.response.data.message).toMatch(/expired/i);
      });

      it.todo('refresh token');
    });
  });

  describe('/secure', () => {
    let body;
    let token;

    beforeEach(async () => {
      body = { username: 'foo', password: 'bar' };
      await axios.post(`${rootUrl}/jwt/signup`, body);
      const res = await axios.post(`${rootUrl}/jwt/login`, body);
      token = res.data.token;
      expect(res.data.token).toMatch(jwtRegEx);
    });

    it('returns response if valid token', async () => {
      const options = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.post(`${rootUrl}/jwt/secure`, body, options);
      expect(res.data.message).toMatch('Hi from JWT, foo!');
    });

    it('returns error if no token', async () => {
      await axios.post(`${rootUrl}/jwt/secure`, body).catch(setError);
      expect(err.response.data.message).toMatch(
        /Authorization header is required/i
      );
    });

    it('returns error if header is malformed', async () => {
      // Missing 'Bearer ';
      const options = { headers: { Authorization: token } };
      await axios.post(`${rootUrl}/jwt/secure`, body, options).catch(setError);
      expect(err.response.data.message).toMatch(
        /Unauthorized! jwt must be provided/i
      );
    });

    it('returns error if invalid token', async () => {
      const options = { headers: { Authorization: 'Bearer nope.nope.nope' } };
      await axios.post(`${rootUrl}/jwt/secure`, body, options).catch(setError);
      expect(err.response.data.message).toMatch(/Unauthorized! invalid token/i);
    });

    // it('returns error if expired token', done => {
    //   expect.assertions(2);
    //   const options = { headers: { Authorization: `Bearer ${token}` } };
    //   // setTimeout(() => {
    //   return axios
    //     .post(`${rootUrl}/jwt/secure`, body, options)
    //     .then(() => {
    //       // Should not get here!
    //       const error = new Error();
    //       error.response = { data: { message: 'Should fail!' } };
    //       throw error;
    //     })
    //     .catch(err => {
    //       expect(err.response.data.message).toMatch(/Unauthorized!/i);
    //       done();
    //     });
    //   // }, 200);
    // });
  });
});
