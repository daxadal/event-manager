# To do

Personal notes about requirements
1. Event.Location can be extended/replaced to lat-lon
1. Rework returned data
1. Published event means just public
1. Only published events are visible if you're not logged in. Private events are visible to logged users. Draft events are visible to the creator. Revise visibility rules
1. Check current token equals DB token to check if it is still valid (logout or multimple logins)
1. Past Events handling is out of scope.
1. Use `bree` for scheduling. `@ladjs/graceful` and `cabin` recommended [here](https://jobscheduler.net/#/?id=node)
1. Users cannot subscribe to draft events (they're not ready and also not visible, duh)

Functional Requirements
1. Users can only have one published event at a time and can subscribe to a maximum of 3 events.
1. Users should receive a notification 24 hours before the start date of each event reminding them that it’s happening the next day.
1. Each event should have its own page to display all details and a subscribe functionality (as described in point #11) below the event details.

Technical Requirements
1. Implement the REST API for this application using Node.js, Express and an ORM of your choice.
1. Implement proper security as you see fit for the application’s authentication.
1. Use a middleware for the custom usability rules.
1. Use SOLID principle, linting and a convention for your code.
1. Add tests where / how you see fit.
1. Protect the application against Denial of Service attacks.
1. Send the reminders notifications using sockets.
1. Comment your code where you see is fit and include a README file with your submission.
1. Creating a bare UI to test the backend is not required but a nice to have.
1. Containerize your application if you think it is necessary..

# Done

Personal notes about requirements
1. Also check for double subscriptions
1. Add subscription date to subscription (always `Date.now()`)
1. Specific methods to change state instad of updating  **NOPE**

Functional Requirements
1. Users should be able to sign-in and sign-out of the application.
1. Only authenticated users should be able to post, edit or delete
events.
1. Events can be edited or deleted after being published.
1. Users can only edit and delete their own events.
1. Users who are not logged in can only view some events but can
not subscribe to an event.
1. Only users who are logged in can subscribe to any event.
1. Each event should have a headline, description, start date and
location.
1. Each event has three states: Draft, Public and Private.
1. Users should not be able to subscribe to their own events.
1. A user subscribes to an event by sending their personal details
(name, email and any other details you think should be
necessary) to the service.
1. Users should see a list of all events (as much as the rules allow)
in the home.

Technical Requirements