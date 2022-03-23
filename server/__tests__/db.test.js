const { makeClient, makeTestDbApi } = require('../db');

let db;

afterEach(async () => {
  await db.closeConnection();
  db = null;
});

// Tests have been extracted into functions, real and mock DBs run the same
// tests. This is to ensure mock DB doesn't fall out of sync with real DB
const testInsertAndFind = async () => {
  const none = await db.findOne({ foo: 'bar' });
  expect(none).toEqual(null);

  await db.insertOne({ username: 'bar', token: 'abc', hash: 'qux' });
  const foundByUsername = await db.findOne({ username: 'bar' });
  const foundByToken = await db.findOne({ token: 'abc' });
  expect(foundByUsername.username).toBe('bar');
  expect(foundByUsername.hash).toBe('qux');
  expect(foundByToken.username).toBe('bar');
  expect(foundByToken.hash).toBe('qux');
};

const testUpdate = async () => {
  await db.insertOne({ username: 'foo', hash: 'bar' });
  const updated = await db.updateOne({ username: 'foo' }, { token: '123' });
  expect(updated.modifiedCount).toBe(1);
  const found = await db.findOne({ username: 'foo' });
  expect(found.hash).toBe('bar');
  expect(found.token).toBe('123');
};

const testUpdateNotFound = async () => {
  const updated = await db.updateOne({ username: 'foo' }, { foo: 'baz' });
  expect(updated.modifiedCount).toBe(0);
};

const testDelete = async () => {
  await db.insertOne({ username: 'foo', hash: 'bar' });
  await db.deleteOne({ username: 'foo' });

  const found = await db.findOne({ username: 'foo' });
  expect(found).toEqual(null);
};

describe('Mock DB', () => {
  beforeEach(() => {
    db = makeTestDbApi();
  });

  it('inserts and finds', testInsertAndFind);
  it('updates', testUpdate);
  it('update does not fail if no matching query', testUpdateNotFound);
  it('deletes', testDelete);
});

describe('Postgres DB', () => {
  beforeEach(async () => {
    db = await makeClient({ DB_TYPE: 'postres' });
    await db.clearAll();
  });

  it('inserts and finds', testInsertAndFind);
  it('updates', testUpdate);
  it('update does not fail if no matching query', testUpdateNotFound);
  it('deletes', testDelete);
});

describe('Mongo DB', () => {
  beforeEach(async () => {
    db = await makeClient({ DB_TYPE: 'mongo' });
    await db.clearAll();
  });

  it('inserts and finds', testInsertAndFind);
  it('updates', testUpdate);
  it('update does not fail if no matching query', testUpdateNotFound);
  it('deletes', testDelete);
});
