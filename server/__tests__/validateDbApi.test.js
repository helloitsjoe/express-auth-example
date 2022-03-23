/* eslint-disable indent */
const {
  validateDbApi,
  makeTestDbApi,
  makeMongoApi,
  makePgApi,
} = require('../db');

describe('validateDbApi', () => {
  it.each`
    methodName
    ${'findOne'}
    ${'insertOne'}
    ${'updateOne'}
    ${'deleteOne'}
    ${'clearAll'}
    ${'closeConnection'}
  `('throws if $methodName is not defined', ({ methodName }) => {
    const api = {
      findOne: () => {},
      insertOne: () => {},
      updateOne: () => {},
      deleteOne: () => {},
      clearAll: () => {},
      closeConnection: () => {},
    };
    api[methodName] = null;
    expect(() => validateDbApi(api)).toThrow(
      `Function ${methodName} must be defined`
    );
  });

  it('validates testDbApi', () => {
    expect(() => validateDbApi(makeTestDbApi())).not.toThrow();
  });

  it('validates makeMongoApi', async () => {
    expect(() => validateDbApi(makeMongoApi())).not.toThrow();
  });

  it('validates makePgApi', async () => {
    expect(() => validateDbApi(makePgApi())).not.toThrow();
  });
});
