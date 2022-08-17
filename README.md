# Event Manager

## General description

Event Manager allows you to manage your upcoming events, either create your own or subscribe to events from other users. No login is required to take a look at available events, but the events you will see may be more limited. Also, login is required to create, update or delete an event, or to subscribe to any event from other users. A notification will be sent to you via socket 24 hours before the event starts, to remind you of it.

# Stack

This project uses these libraries for this purposes:

- `express`: API configuration
- `joi`: Parameter validation
- `mongoose`: Implementing the database
- `winston`: Logging
- `module-alias`: Importing routes as absolutes instead of relatives
- `socket.io`: Implementing server-side sockets
- `swagger-jsdoc`: Generating OpenAPI documentation
- `swagger-ui-express`: Serving OpenAPI documentation

This project also uses the following dev dependencies:

- `jest`/`ts-jest`: Testing
- `jest-unit`: Generating testing reports (compatible with Gitlab CI/CD)
- `@shelf/jest-mongodb`: Replacing the DB for testing
- `socket.io-client`: Implementing client-side sockets
- `supertest`: Making request to the express app

## Implementation

This API is made using Node.JS, Express and Socket.io. The database is implemented using MongoDB and Mongoose. Authentication is implemented using Basic Auth to log you in and JWT through Bearer Auth to keep you logged in. Input correctness is implemented using Joi.

## Configuration

Some parameters can (and should) be configured in environment variables. As this project uses `dotenv`, these can be included in a `.env` file. A `.sample-env` file is provided as a template. All parameters are listed, both required and optional. For the latter, default values can be looked up at `./config/index.js` file.

## Execution

The server can be started using `npm start` script. The server also can be executed through `nodemon` using `npn run watch`.

## Cleanup and test

Tests on the API (powered by `jest`) can be performed by executing `npm test`.

## Documentation

OpenAPI documentation is generated every time `npm start` is executed.
It can be found at `<rootDir>/src/docs/event-manager-api.openapi.json`.
This documentation can also be manually generated using `npm run docs`.

If the server is executed, this documentation is also served as HTML at `localhost:3000/docs`, and can be used to interact with the running server.

## Socket events summary

### Client to server
* `sign-in`: Sends the session token to the socket server to **bind** this socket to the user. This event should be sent **after** signing in or signing up through API and/or **after** creating a new socket for the user.
* `sign-out`: Sends the session token to the socket server to **unbind** this socket from the user. This event should be sent **before** signing out through API and/or **before** disconnecting the user's socket.

### Server to client
* `reminder`: Sends a reminder to the user about an upcoming event. The message containes a user-friendly message and additional "raw" details
* `sign-in-ok`: Response to client's `sign-in` upon success
* `sign-in-error`: Response to client's `sign-in` upon error
* `sign-out-ok`:  Response to client's `sign-out` upon success
* `sign-out-error`:  Response to client's `sign-out` upon error
