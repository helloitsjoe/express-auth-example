const express = require('express');
const path = require('path');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const expressSession = require('express-session');
const jwt = require('./routes/jwt');
const oauth = require('./routes/oauth');
const graphql = require('./routes/graphql');
const session = require('./routes/session');
const simpleToken = require('./routes/simpleToken');
const { makeDbMiddleware, errorMiddleware } = require('./middleware');
const { getTokenExp } = require('./utils');

const makeAuthServer = async (port = 3001, db) => {
  const app = express();
  const server = http.createServer(app);

  // HTML and API need to live on the same port for session auth, haven't
  // figured out how to get cross-domain cookies working.
  app.use(express.static(path.join(__dirname, '../public')));
  app.use(cors());
  app.use(bodyParser.json());
  app.use(
    expressSession({
      secret: process.env.EXPRESS_SESSION_SECRET,
      resave: false,
      saveUninitialized: true,
      cookie: {
        maxAge: getTokenExp() * 1000,
      },
    })
  );
  app.use(makeDbMiddleware(db));

  app.use('/jwt', jwt);
  app.use('/session', session);
  app.use('/simple-token', simpleToken);
  app.use('/oauth', oauth);

  // TODO: Add different types of auth to this route
  app.use('/graphql', graphql);

  app.use(errorMiddleware);

  return new Promise((resolve, reject) => {
    server.on('error', e => {
      console.error(e);
      reject(e);
    });

    server.listen(port, () => {
      console.log(`Auth Server listening on http://localhost:${server.address().port}`);
      return resolve(server);
    });
  });
};

module.exports = makeAuthServer;
