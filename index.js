'use strict'

const express = require('express');
const bodyParser = require('body-parser');
const graphqlHttp = require('express-graphql');
const { buildSchema } = require('graphql');

const app = express();
app.use(bodyParser.json())

app.use('/graphql', graphqlHttp({
  schema: buildSchema(`
    type RootQuery{
      events: [String!]!
    }

    type RootMutation{
      createEvent(name: String): String!
    }

    schema{
      query:RootQuery
      mutation:RootMutation
    }
  `),
  rootValue: {
    events: () => {
      return ['Going out', 'chattering', 'taking a walk']
    },
    createEvent: (args) => {
      const eventName = args.name;
      return eventName;
    }
  },
  graphiql: true
}))

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`Server listening on port ${port}`))
