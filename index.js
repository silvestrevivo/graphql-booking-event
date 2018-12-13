'use strict'

const express = require('express');
const bodyParser = require('body-parser');
const graphqlHttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');

const Event = require('./models/Event');

const app = express();

app.use(bodyParser.json())

app.use('/graphql', graphqlHttp({
  schema: buildSchema(`
    type Event{
      _id: ID!
      title: String!
      description: String!
      price: Float!
      date: String!
    }

    input EventInput {
      title: String!
      description: String!
      price: Float!
      date: String!
    }

    type RootQuery{
      events: [Event!]!
    }

    type RootMutation{
      createEvent(eventInput: EventInput): Event
    }

    schema{
      query:RootQuery
      mutation:RootMutation
    }
  `),
  rootValue: {
    events: () => {
      return Event.find().then(events => {
        return events.map(event => {
          return { ...event._doc, _id: event._doc._id.toString() }
        })
      }).catch(err => {
        console.log(err)
        throw err;
      })
    },
    createEvent: (args) => {
      const event = new Event({
        title: args.eventInput.title,
        description: args.eventInput.description,
        price: +args.eventInput.price,
        date: new Date(args.eventInput.date)
      });
      return event.save()
        .then(result => {
          console.log(result)
          return { ...event._doc, _id: event.id }
        })
        .catch(err => {
          console.log(err)
          throw err;
        })
    }
  },
  graphiql: true
}))

// file configuration to run DB
const config = require('./config/keys').get(process.env.NODE_ENV)

// Connecting to DB
app.set('port', process.env.PORT || 3000)
mongoose.Promise = global.Promise
mongoose.set('useCreateIndex', true)
mongoose.connect(
  config.DATABASE,
  { useNewUrlParser: true },
)

mongoose.connection
  .once('open', () => {
    // making the app listening to port
    app.listen(app.get('port'), () => {
      console.log(`Server started on port ${app.get('port')}
      Connected to MLab Database`)
    })
  })
  .on('error', error => {
    // in case of error
    return console.warn(`Error connecting to the data base: ${error}`)
  })
