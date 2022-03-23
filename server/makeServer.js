const express = require('express');
const path = require('path');
const http = require('http');

const app = express();
const server = http.createServer(app);

const makeServer = async (port = 3000) => {
  app.use(express.static(path.join(__dirname, '../public/oauth')));

  // App is already listening
  if (server.address()) return Promise.resolve(server);

  return new Promise((resolve, reject) => {
    server.listen(port, () => {
      console.log(`Static server listening on http://localhost:${port}`);
      return resolve(server);
    });

    server.on('error', (e) => {
      console.error(e);
      reject(e);
    });
  });
};

module.exports = makeServer;
