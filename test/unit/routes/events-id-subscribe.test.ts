import request from "supertest";
import { mocked } from "jest-mock";

import app from "@/app";
import { addUserToRequest } from "@/services/auth";
import { EventState, format, Subscription, UserDocument } from "@/services/db";
import { closeConnection, createConnection } from "@/services/db/setup";

import {
  clearDatabase,
  createMockEvent,
  createMockEvents,
  createMockUser,
} from "test/mocks/db";

jest.mock("@/services/auth", () => {
  const module =
    jest.requireActual<typeof import("@/services/auth")>("@/services/auth");
  return {
    ...module,
    addUserToRequest: jest.fn((req, res, next) => next()),
    ensureLoggedIn: jest.fn((req, res, next) => next()),
  };
});

const mockedAddUserToRequest = mocked(addUserToRequest, true);

describe("The /events API", () => {
  beforeAll(createConnection);

  beforeEach(jest.clearAllMocks);

  afterEach(clearDatabase);

  afterAll(closeConnection);

  describe("POST /events/{eventId}/subscribe endpoint", () => {
    let callerUser: UserDocument;
    let otherUser: UserDocument;

    beforeEach(async () => {
      callerUser = await createMockUser({ email: "caller@doe.com" });
      otherUser = await createMockUser({ email: "other@doe.com" });

      mockedAddUserToRequest.mockImplementationOnce((req: any, res, next) => {
        req.token = "token";
        req.user = callerUser;
        next();
      });
    });

    it("Returns 400 if the event does not exist", async () => {
      // given
      const eventId = "60123456789abcdef1234567";
      const body = {};

      // when
      const response = await request(app)
        .post(`/events/${eventId}/subscribe`)
        .send(body);

      // then
      expect(response.status).toEqual(400);
      expect(response.body).toBeDefined();
      expect(response.body.message).toEqual("Event not found");
    });

    it("Returns 400 if you are the owner of the event you want to subscribe to", async () => {
      // given
      const event = await createMockEvent({
        creatorId: callerUser._id,
        state: EventState.PUBLIC,
      });
      const eventId = event._id;

      const body = {};

      // when
      const response = await request(app)
        .post(`/events/${eventId}/subscribe`)
        .send(body);

      // then
      expect(response.status).toEqual(400);
      expect(response.body).toBeDefined();
      expect(response.body.message).toEqual(
        "You can't subscribe to your own events"
      );
    });

    it("Returns 400 if the comment is too long", async () => {
      // given
      const event = await createMockEvent({
        creatorId: otherUser._id,
        state: EventState.PUBLIC,
      });
      const eventId = event._id;

      const body = {
        comment:
          "BBDzxzQQ1Z Sk7htzCHH yYoxbBXjg D6xQVB9Pl W5NjeVjvl WUWUH6q3s d9nLlX6Dd u7aQ8XOKH LTtWw0JHb PDQMhmmeq IVEqhZbK1 QTOW9wPLd cvWkEDvTL Wg4v67A8EBBDzxzQQ1Z Sk7htzCHH yYoxbBXjg D6xQVB9Pl W5NjeVjvl WUWUH6q3s d9nLlX6Dd u7aQ8XOKH LTtWw0JHb PDQMhmmeq IVEqhZbK1 QTOW9wPLd cvWkEDvTL Wg4v67A8E T4A71VIYj vYhU2TF8g FKdjU9fGO FxkM8djYP 3Jqz6iROj 1UJXjvIid pESX4XP1F hv66f7OAj 97TcC1XyG MlS86AoUi aipsTaZBV eh1rIukyT DeWavtMY8 A90ICXjOT EO3yQ2LAW 7zFT5A2LB d3wQhIl2X zxZw2FiwL XG0jp484e I40jYQBVq jAoH1Ixii GZdN1Okva scwwQCxqE J7i1HixhA Mws9icxXw jZbWMHKGO SLCFX2IFX E8v30FU04 I9ZVhavaP 4ZZnrzhUq vz1J2e2c3 eKXiU4qdr KcB9CF9Nf rNbG9zfDd RgvolUcZe SS2iTdEAp ",
      };

      // when
      const response = await request(app)
        .post(`/events/${eventId}/subscribe`)
        .send(body);

      // then
      expect(response.status).toEqual(400);
      expect(response.body).toBeDefined();
      expect(response.body.message).toMatch(
        /^.comment. length must be less than or equal to \d+ characters long$/
      );
    });

    it("Returns 200 and the subscription if no comment is present", async () => {
      // given
      const event = await createMockEvent({
        creatorId: otherUser._id,
        state: EventState.PUBLIC,
      });
      const eventId = event._id;

      const body = {};

      // when
      const response = await request(app)
        .post(`/events/${eventId}/subscribe`)
        .send(body);

      // then
      expect(response.status).toEqual(200);
      expect(response.body).toBeDefined();
      expect(response.body.message).toEqual("Subscribed successfully");
      expect(response.body.subscription).toBeDefined();
    });

    it("Returns 200 and the subscription if a comment is present", async () => {
      // given
      const event = await createMockEvent({
        creatorId: otherUser._id,
        state: EventState.PUBLIC,
      });
      const eventId = event._id;

      const body = { comment: "OMG, I can't wait!!" };

      // when
      const response = await request(app)
        .post(`/events/${eventId}/subscribe`)
        .send(body);

      // then
      expect(response.status).toEqual(200);
      expect(response.body).toBeDefined();
      expect(response.body.message).toEqual("Subscribed successfully");
      expect(response.body.subscription).toBeDefined();
    });

    it("Returns 400 and the previous subscription is the user is already subscribed to this event", async () => {
      // given
      const event = await createMockEvent({
        creatorId: otherUser._id,
        state: EventState.PUBLIC,
      });
      const oldSubscription = await new Subscription({
        eventId: event.id,
        subscriberId: callerUser.id,
        subscriptionDate: new Date(1970, 0, 1),
        comment: "I have subscribed once",
      }).save();

      const eventId = event._id;
      const body = { comment: "I'm subscribing again" };

      // when
      const response = await request(app)
        .post(`/events/${eventId}/subscribe`)
        .send(body);

      // then
      expect(response.status).toEqual(400);
      expect(response.body).toBeDefined();
      expect(response.body.message).toEqual(
        "You already have subscribed to this event"
      );
      expect(response.body.subscription).toBeDefined();
      expect(response.body.subscription).toMatchObject(format(oldSubscription));
    });

    it("Returns 400 is the user has reached the maximum number of subscriptions", async () => {
      // given
      const MAX_SUBSCRIPTIONS = 3;

      const events = await createMockEvents(MAX_SUBSCRIPTIONS, {
        creatorId: otherUser._id,
        state: EventState.PUBLIC,
      });
      const subscriptionPromises = events.map((event) =>
        new Subscription({
          eventId: event.id,
          subscriberId: callerUser.id,
          subscriptionDate: new Date(),
        }).save()
      );
      await Promise.all(subscriptionPromises);

      const event = await createMockEvent({
        creatorId: otherUser._id,
        state: EventState.PUBLIC,
      });
      const eventId = event._id;
      const body = {};

      // when
      const response = await request(app)
        .post(`/events/${eventId}/subscribe`)
        .send(body);

      // then
      expect(response.status).toEqual(400);
      expect(response.body).toBeDefined();
      expect(response.body.message).toEqual("Subscribed events limit exceeded");
    });
  });
});
