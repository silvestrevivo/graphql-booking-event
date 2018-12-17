'use strict'

const express = require('express');
const bodyParser = require('body-parser');
const graphqlHttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Event = require('./models/Event');
const User = require('./models/User');

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

    type User{
      _id: ID!
      email: String!
      password: String
    }

    input EventInput {
      title: String!
      description: String!
      price: Float!
      date: String!
    }

    input UserInput {
      email: String!
      password: String!
    }

    type RootQuery{
      events: [Event!]!
    }

    type RootMutation{
      createEvent(eventInput: EventInput): Event
      createUser(userInput: UserInput): User
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
        date: new Date(args.eventInput.date),
        creator: '5c181135f30fab0e49a86b85'
      });
      let createdEvent;
      return event.save()
        .then(result => {
          createdEvent = { ...result._doc, _id: result.id }
          return User.findById('5c181135f30fab0e49a86b85')
        })
        .then(user => {
          if (!user) {
            throw new Error('User not found')
          }
          user.createdEvents.push(event);
          return user.save()
        })
        .then(result => {
          return createdEvent;
        })
        .catch(err => {
          console.log(err)
          throw err;
        })
    },
    createUser: (args) => {
      return User.findOne({ email: args.userInput.email })
        .then(user => {
          if (user) {
            throw new Error('User already exists')
          }
          return bcrypt.hash(args.userInput.password, 12)
        })
        .then(hashedPassord => {
          const user = new User({
            email: args.userInput.email,
            password: hashedPassord
          })
          return user.save();
        })
        .then(result => {
          return { ...result._doc, password: null, _id: result.id }
        })
        .catch(err => { throw err })
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
Connected to MongoAtlas Database`)
    })
  })
  .on('error', error => {
    // in case of error
    return console.warn(`Error connecting to the data base: ${error}`)
  })
