const makeServer = require('./makeServer');
const makeAuthServer = require('./makeAuthServer');
const { makeClient } = require('./db');

makeClient(process.env)
  .then((users) => {
    makeServer(3000);
    makeAuthServer(3001, { users });
  })
  .catch((err) => {
    console.error('Error connecting to DB:', err);
  });

// Handle Ctrl-C
process.on('SIGINT', () => {
  console.info('Interrupted');
  process.exit(0);
});

// Handle docker-compose shutdown
process.on('SIGTERM', () => {
  console.info('Terminating');
  process.exit(0);
});
