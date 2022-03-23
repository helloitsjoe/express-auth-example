/* eslint-disable camelcase */
import openOauth from 'oauth-open';
import axios from 'axios';

const getUrl = (endpoint, port = 3000) => `http://localhost:${port}${endpoint}`;

const DEFAULT_MS = process.env.NODE_ENV === 'test' ? 0 : 500;

export const wait = (ms = DEFAULT_MS, shouldFail = false) =>
  new Promise((resolve, reject) =>
    setTimeout(() => {
      return shouldFail ? reject(new Error('Oh nuts')) : resolve();
    }, ms)
  );

export function signUp({ endpoint, username, password }) {
  return wait().then(() =>
    axios.post(getUrl(`${endpoint}/signup`, 3001), { username, password })
  );
}

export function login({ endpoint, username, password }) {
  return wait().then(() =>
    axios.post(getUrl(`${endpoint}/login`, 3001), { username, password })
  );
}

export function logOut({ endpoint, token }) {
  return wait().then(() =>
    axios.post(getUrl(`${endpoint}/logout`, 3001), { token })
  );
}

export function checkLoggedIn({ endpoint, token }) {
  return wait().then(() =>
    axios.get(getUrl(`${endpoint}/login`, 3001), {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
      crossDomain: true,
    })
  );
}

export function sendSecure({ endpoint, message, token }) {
  return wait().then(() =>
    axios.post(
      getUrl(`${endpoint}/secure`, 3001),
      { message },
      {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
        crossDomain: true,
      }
    )
  );
}

export function oauth() {
  return wait()
    .then(() => {
      return new Promise((resolve, reject) => {
        // TODO: Redirect instead of popup
        // TODO: Don't use openOauth - implement yourself
        // window.location.assign(getUrl(`/oauth?redirect_to=${window.location.href}`, 3001));
        openOauth(getUrl(`/oauth`, 3001), (err, data) => {
          if (err) return reject(err);
          return resolve(data);
        });
      });
    })
    .then(({ code }) => axios.post(getUrl('/oauth/token', 3001), { code }))
    .then(({ data }) => data.access_token);
}

export function updateSecureData(message, authorization) {
  return wait().then(() => {
    const options = { headers: { authorization } };
    return axios.post(getUrl('/oauth/secure', 3001), { message }, options);
  });
}
