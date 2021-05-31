# Whisbi Event Manager

## General description

Whisbi Event Manager allows you to manage your upcoming events, either create your own or subscribe to events from other users. No login is required to take a look at available events, but the events you will see may be more limited. Also, login is required to create, update or delete an event, or to subscribe to any event from other users. A notification will be sent to you via socket 24 hours before the event starts, to remind you of it.

## Implementation

This API is made using Node.JS, Express and Socket.io. Database is implemented using MongoDB and Mongoose. Authentication is implemented using Basic Auth to log you in and JWT through Bearer Auth to keep you logged in.

## Configuration

Some parameters can (and should) be configured in enviroment variables. As this proyect uses `dotenv`, theese can be included in a `.env` file. A `.sample-env` file is provided as a template. All parameters are listed, both required and optional. For the latter, default values can be looked up at `./config/index.js` file.

## Execution

Server can be started using `npm start` script. Server can be executed through `nodemon` using `npn run watch`.

## Cleanup and test

Database can be purged using the `npm run reset`. Tests on the API (powered by `mocha`) can be performed executing `npm test`. (This script assumes the server is already up and running).

_**Important notice:** `npm test` script will purge all data from the database before it\'s run. If that behavior is not desired, tests can be run using `mocha` command, if installed globally. If a global `mocha` command is not available, you can also use the `npm run mocha` script._