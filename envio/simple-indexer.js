const express = require('express');
const { GraphQLHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const axios = require('axios');

const app = express();

// Simple GraphQL schema
const schema = buildSchema(`
  type Query {
    transfers: [Transfer]
    health: String
  }
  
  type Transfer {
    id: String
    from: String
    to: String
    value: String
    blockNumber: Int
    timestamp: String
  }
`);

// Mock resolver
const root = {
  transfers: () => [
    {
      id: "1",
      from: "0x742d35Cc6634C0532925a3b8D4C9db4C8b9b8b8b",
      to: "0xfB0A5Ebf31A15Ee3cD51080F1bCAC39Cd676343f",
      value: "1000000000",
      blockNumber: 12345,
      timestamp: new Date().toISOString()
    }
  ],
  health: () => "OK"
};

app.use('/v1/graphql', GraphQLHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(8080, () => {
  console.log('🚀 Simple indexer running on http://localhost:8080');
  console.log('📊 GraphQL endpoint: http://localhost:8080/v1/graphql');
});
