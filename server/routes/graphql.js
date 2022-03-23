const express = require('express');
// const { makeExecutableSchema } = require('graphql-tools');
// const { buildSchema } = require('graphql');

// const typeDefs = [];
// const resolvers = {};

// const schema = makeExecutableSchema({ typeDefs, resolvers });

// const basicSchema = buildSchema(`
//   type Query {
//     foo: String!
//   }
// `);

// const rootValue = {
//   foo: 'bar',
// };

// const gql = gqlHTTP(() => ({
//   schema,
//   rootValue,
//   graphiql: true,
// }));

const router = express.Router();

router.post('/', () => {});
router.get('/', () => {});

module.exports = router;
