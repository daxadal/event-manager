# Event Manager (API)

_(This project is still a work in progress.
Functionalities might be missing or bugs might be present)_

Event Manager allows you to manage your upcoming events, either create your own or subscribe to events from other users.
No login is required to take a look at available events, but the events you will see may be more limited.
Login is required to create, update or delete an event, or to subscribe to any event from other users.
A notification will be sent to you via socket 24 hours before the event starts, to remind you of it.

# Repositories

- Main repo: https://github.com/daxadal/event-manager
- Backup repo: https://gitlab.com/egarciadececa/event-manager

# Availability

_(This server is not currently being served on the Internet)_

# Previous steps

Create a `.env` file based on `sample.env` file.
Uncomment and fill all required environment variables.
All variables are required, except otherwise specified.

Install and start an MongoDB service on the chosen host.

# Installation and execution

To run the server, first you have to install the dependencies:

```bash
npm ci
```

The server can be started using the following command:

```bash
npm start
```

By default, the server mounts at `http://localhost:3000`, which will be referred as `{{basePath}}` from now on.

# Documentation

A documentation file is generated each time the server is started.
This documentation can also be manually generated executing:

```bash
npm run docs
```

Said file can be found at `<rootDir>/src/docs/event-manager.openapi.json`.
This file can also be imported to applications like [Postman](https://www.postman.com/downloads/).

This documentation is also served at `{{basePath}}/docs`, which can be accessed using the browser.
Using that UI, the documented endpoints can be tested (if the server is running at the configured domain).

# Testing

Tests can be executed using the following command:

```bash
npm test
```

Tests are powered by `jest`, and a report file (compatible with Gitlab CI/CD) is generated on each execution.

Tests use the `mysql` service in the running machine.
A test database must exist, and the configured user must have all permissions in it

_(**NOTE**: If the variable `DB_AUTO_CREATE` is set to true, there's no need to create the database beforehand.
But, in this case, the configured user must have permission to create databases)_

# Socket events summary

## Client to server

- `sign-in`: Sends the session token to the socket server to **bind** this socket to the user.
  This event should be sent **after** signing in or signing up through API and/or **after** creating a new socket for the user.
- `sign-out`: Sends the session token to the socket server to **unbind** this socket from the user.
  This event should be sent **before** signing out through API and/or **before** disconnecting the user's socket.

## Server to client

- `reminder`: Sends a reminder to the user about an upcoming event.
  The message contains a user-friendly message and additional "raw" details
- `sign-in-ok`: Response to client's `sign-in` upon success
- `sign-in-error`: Response to client's `sign-in` upon error
- `sign-out-ok`: Response to client's `sign-out` upon success
- `sign-out-error`: Response to client's `sign-out` upon error
