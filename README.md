# Whisbi Event Manager

## General description

Whisbi Event Manager allows you to manage your upcoming events, either create your own or subscribe to events from other users. No login is required to take a look at available events, but the events you will see may be more limited. Also, login is required to create, update or delete an event, or to subscribe to any event from other users. A notification will be sent to you via socket 24 hours before the event starts, to remind you of it.

## Implementation

This API is made using Node.JS, Express and Socket.io. The database is implemented using MongoDB and Mongoose. Authentication is implemented using Basic Auth to log you in and JWT through Bearer Auth to keep you logged in. Input correctness is implemented using Joi.

## Configuration

Some parameters can (and should) be configured in environment variables. As this project uses `dotenv`, these can be included in a `.env` file. A `.sample-env` file is provided as a template. All parameters are listed, both required and optional. For the latter, default values can be looked up at `./config/index.js` file.

## Execution

The server can be started using `npm start` script. The server also can be executed through `nodemon` using `npn run watch`.

## Cleanup and test

The database can be purged using the `npm run reset`. Tests on the API (powered by `mocha`) can be performed by executing `npm test`. (This script assumes the server is already up and running).

A Postman collection is also provided to test the API manually.

### Important notices

#### Purges
`npm test` script will purge all data from the database before it\'s run. If that behavior is not desired, tests can be run using `mocha` command, if installed globally. If a global `mocha` command is not available, you can also use the `npm run mocha` script. Nevertheless, as `mocha` assumes the database is empty when the tests are performed, some tests may fail if the database is not reset.

#### Dev API
For some specific tests, Dev API is expected to be mounted (more info below). If Dev API is not mounted, those specific tests will be marked as pending.

#### Denial of service
As part of the tests, `mocha` will try to perform a DoS attack. After `mocha` is run, the server surely will decline any more requests from the same host for a minute. It is recommended to restart the server after that (or wait a minute) before making more requests.

## API summary

Unless otherwise specified:
* All `POST` and `PUT` methods expect a JSON body.
* All `GET` and `DELETE` methods **do not** expect any body.
* All endpoints **require** the user to provide a session token in the Bearer Auth.

### Users
* `POST /users/sign-up`: Creates a new user and returns a token for authentication in future requests. No Auth required.
* `POST /users/sign-in`: Logs in an existing user and returns a token for authentication in future requests. Credentials are provided as Basic Auth (email:password) instead of JSON body. If multiple logins are performed, only the latest token will be valid.
* `POST /users/sign-out`: Logs out an existing user, making the token no longer valid. No body required, just the session token.

### Events
* `GET /events`: Get all events visible with current credentials. A session token is allowed but not required.
* `POST /events`: Creates a new event. Only one public event per user is allowed.
* `GET /events/{id}`: Get an event (if visible). A session token is allowed but not required.
* `PUT /events/{id}`: Updates an event. The event must have been created by the same user. Partial updates are allowed.
* `DELETE /events/{id}`: Deletes an event. The event must have been created by the same user.
* `POST /events/{id}/subscribe`: Subscribe to an event from **another** user. Only 3 subscriptions per user are allowed. A comment can be attached to the subscription.

### Jobs
This API is called by the own server, since background processes does not have access to the connected sockets. It uses a Bearer Auth, but completely different from the above stated and with a very short expiration.
* `POST /jobs/remind`: Finds the events that will ocurr in exactly 24 hours, or another time lapse if configured in the environment variables, and sends a reminder to the users through sockets.

### Dev
This API is only mounted if `DEVELOPMENT_API=true` in the environment variables, and provides some extra methods to test the sockets. These methods are not expected to be deployed to production (and **shouldn't be**), so no Auth or body is required
* `POST /dev/ping`: Pings all connected sockets.
* `POST /dev/remind`: Finds all the events that will occur in exactly 24 hours, or another time lapse if configured in the environment variables, and sends a reminder to subscribed users through sockets.
* `POST /dev/remind-bree`: Same as above but using background jobs.
* `POST /dev/remind-all`: Gets all events in the database and sends a reminder to subscribed users through sockets.
* `POST /dev/remind-all-bree`: Same as above but using background jobs.

## Socket events summary

### Client to server
* `sign-in`: Sends the session token to the socket server to **bind** this socket to the user. This event should be sent **after** signing in or signing up through API and/or **after** creating a new socket for the user.
* `sign-out`: Sends the session token to the socket server to **unbind** this socket from the user. This event should be sent **before** signing out through API and/or **before** disconnecting the user's socket.
* `PONG`: response to server's `PING`.

### Server to client
* `reminder`: Sends a reminder to the user about an upcoming event. The message containes a user-friendly message and additional "raw" details
* `PING`: Pings a socket
* `sign-in-ok`: Response to client's `sign-in` upon success
* `sign-in-error`: Response to client's `sign-in` upon error
* `sign-out-ok`:  Response to client's `sign-out` upon success
* `sign-out-error`:  Response to client's `sign-out` upon error
