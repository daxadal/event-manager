import request from "supertest";
import crypto from "crypto";
import { Document } from "mongoose";
import { mocked } from "ts-jest/utils";

import app from "@/app";
import { EVENT_RPM, EVENT_SIZE } from "@/routes/events";
import { decodeToken } from "@/services/auth";
import {
  closeConnection,
  createConnection,
  Event,
  EventType,
  format,
  User,
  UserType,
} from "@/services/db";

import { clearDatabase, createMockEvent, createMockUser } from "test/mocks/db";

jest.mock("@/services/auth", () => {
  const module =
    jest.requireActual<typeof import("@/services/auth")>("@/services/auth");

  return {
    ...module,
    decodeToken: jest.fn((req, res, next) => next()),
    verifyToken: jest.fn((req, res, next) => next()),
  };
});
decodeToken;
const mockedDecodeToken = mocked(decodeToken, true);

describe("The /events API", () => {
  beforeAll(createConnection);

  beforeEach(jest.clearAllMocks);

  afterEach(clearDatabase);

  afterAll(closeConnection);

  describe("GET /events/{eventId} endpoint", () => {
    let creatorUser: UserType & Document;
    let otherUser: UserType & Document;

    beforeEach(async () => {
      creatorUser = await createMockUser({ email: "creator@doe.com" });
      otherUser = await createMockUser({ email: "other@doe.com" });
    });

    it("Returns 400 if the event does not exist", async () => {
      // given
      mockedDecodeToken.mockImplementationOnce(async (req: any, res, next) => {
        const user = await User.findOne({ email: "creator@doe.com" });
        req.token = user ? "token" : undefined;
        req.user = user;

        next();
      });
      const eventId = "60123456789abcdef1234567";

      // when
      const response = await request(app).get(`/events/${eventId}`);

      // then
      expect(response.status).toEqual(400);
      expect(response.body).toBeDefined();
      expect(response.body.error).toEqual("Event not found");
    });

    it.each`
      authUser           | state        | reason
      ${"other@doe.com"} | ${"draft"}   | ${"the event is draft and the caller is NOT the creator"}
      ${undefined}       | ${"private"} | ${"the event is private and the caller is NOT authenticated"}
    `("Returns 400 if $reason", async ({ authUser, state }) => {
      // given
      mockedDecodeToken.mockImplementationOnce(async (req: any, res, next) => {
        if (authUser) {
          const user = await User.findOne({ email: authUser });
          req.token = user ? "token" : undefined;
          req.user = user;
        }
        next();
      });
      const event = await createMockEvent({
        creatorId: creatorUser._id,
        state,
      });
      const eventId = event._id;

      // when
      const response = await request(app).get(`/events/${eventId}`);

      // then
      expect(response.status).toEqual(400);
      expect(response.body).toBeDefined();
      expect(response.body.error).toEqual("Event not found");
    });

    it.each`
      authUser             | state        | reason
      ${"creator@doe.com"} | ${"draft"}   | ${"the event is draft and the caller is the creator"}
      ${"other@doe.com"}   | ${"private"} | ${"the event is private and the caller is authenticated"}
      ${undefined}         | ${"public"}  | ${"the event is public"}
    `("Returns 200 and an event if $reason", async ({ authUser, state }) => {
      // given
      mockedDecodeToken.mockImplementationOnce(async (req: any, res, next) => {
        if (authUser) {
          const user = await User.findOne({ email: authUser });
          req.token = user ? "token" : undefined;
          req.user = user;
        }
        next();
      });
      const event = await createMockEvent({
        creatorId: creatorUser._id,
        state,
      });
      const eventId = event._id;

      // when
      const response = await request(app).get(`/events/${eventId}`);

      // then
      const formattedEvent = format(event);

      expect(response.status).toEqual(200);
      expect(response.body).toBeDefined();
      expect(response.body.event).toMatchObject<EventType>(formattedEvent);
    });
  });

  describe("PUT /events/{eventId} endpoint", () => {
    let callerUser: UserType & Document;
    let otherUser: UserType & Document;

    beforeEach(async () => {
      callerUser = await createMockUser({ email: "caller@doe.com" });
      otherUser = await createMockUser({ email: "other@doe.com" });

      mockedDecodeToken.mockImplementationOnce((req: any, res, next) => {
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
      const response = await request(app).put(`/events/${eventId}`).send(body);

      // then
      expect(response.status).toEqual(400);
      expect(response.body).toBeDefined();
      expect(response.body.error).toEqual("Event not found");
    });

    it("Returns 400 if only one of `location.lat` or `location.lon` is present", async () => {
      // given
      const event = await createMockEvent({ creatorId: callerUser._id });
      const eventId = event._id;

      const body = {
        headline: "Updated event headline",
        startDate: new Date(2050, 2, 1),
        location: { name: "Somewhere different", lat: 40 },
      };

      // when
      const response = await request(app).put(`/events/${eventId}`).send(body);

      // then
      expect(response.status).toEqual(400);
      expect(response.body).toBeDefined();
      expect(response.body.error).toMatch(
        /location.* contains \[lat\] without its required peers \[lon\]/
      );
    });

    it("Returns 200 and the unmodified event if no body is present", async () => {
      // given
      const event = await createMockEvent({ creatorId: callerUser._id });
      const eventId = event._id;

      const body = {};

      // when
      const response = await request(app).put(`/events/${eventId}`).send(body);

      // then
      const createdEvent = await Event.findOne({});

      expect(response.status).toEqual(200);
      expect(response.body).toBeDefined();
      expect(response.body.message).toEqual("Event updated");
      expect(response.body.event).toBeDefined();
      expect(response.body.event).toMatchObject<EventType>(
        format(createdEvent)
      );
    });

    it("Returns 200 and the modified event if fields are present", async () => {
      // given
      const event = await createMockEvent({ creatorId: callerUser._id });
      const eventId = event._id;

      const body = {
        headline: "Updated event headline",
        startDate: new Date(2050, 2, 1),
        location: { name: "Somewhere different" },
      };

      // when
      const response = await request(app).put(`/events/${eventId}`).send(body);

      // then
      const createdEvent = await Event.findOne({});

      expect(response.status).toEqual(200);
      expect(response.body).toBeDefined();
      expect(response.body.message).toEqual("Event updated");
      expect(response.body.event).toBeDefined();
      expect(response.body.event).toMatchObject<EventType>(
        format(createdEvent)
      );
    });

    it("Returns 400 if the event is not visible", async () => {
      // given
      const event = await createMockEvent({
        creatorId: otherUser._id,
        state: "draft",
      });
      const eventId = event._id;

      const body = {
        headline: "Updated event headline",
        startDate: new Date(2050, 2, 1),
        location: { name: "Somewhere different" },
      };

      // when
      const response = await request(app).put(`/events/${eventId}`).send(body);

      // then
      expect(response.status).toEqual(400);
      expect(response.body).toBeDefined();
      expect(response.body.error).toEqual("Event not found");
    });

    it("Returns 400 if the authenticated user is not the creator of the event", async () => {
      // given
      const event = await createMockEvent({
        creatorId: otherUser._id,
        state: "public",
      });
      const eventId = event._id;

      const body = {
        headline: "Updated event headline",
        startDate: new Date(2050, 2, 1),
        location: { name: "Somewhere different" },
      };

      // when
      const response = await request(app).put(`/events/${eventId}`).send(body);

      // then
      expect(response.status).toEqual(400);
      expect(response.body).toBeDefined();
      expect(response.body.error).toEqual(
        "Events can only be edited by their creator"
      );
    });
  });

  describe("DELETE /events/{eventId} endpoint", () => {
    let callerUser: UserType & Document;
    let otherUser: UserType & Document;

    beforeEach(async () => {
      callerUser = await createMockUser({ email: "caller@doe.com" });
      otherUser = await createMockUser({ email: "other@doe.com" });

      mockedDecodeToken.mockImplementationOnce((req: any, res, next) => {
        req.token = "token";
        req.user = callerUser;
        next();
      });
    });

    it("Returns 400 if the event does not exist", async () => {
      // given
      const eventId = "60123456789abcdef1234567";

      // when
      const response = await request(app).del(`/events/${eventId}`);

      // then
      expect(response.status).toEqual(400);
      expect(response.body).toBeDefined();
      expect(response.body.error).toEqual("Event not found");
    });

    it("Returns 400 if the event is not visible", async () => {
      // given
      const event = await createMockEvent({
        creatorId: otherUser._id,
        state: "draft",
      });
      const eventId = event._id;

      // when
      const response = await request(app).del(`/events/${eventId}`);

      // then
      expect(response.status).toEqual(400);
      expect(response.body).toBeDefined();
      expect(response.body.error).toEqual("Event not found");
    });

    it("Returns 400 if the event does not belong to the user", async () => {
      // given
      const event = await createMockEvent({
        creatorId: otherUser._id,
        state: "public",
      });
      const eventId = event._id;

      // when
      const response = await request(app).del(`/events/${eventId}`);

      // then
      expect(response.status).toEqual(400);
      expect(response.body).toBeDefined();
      expect(response.body.error).toEqual(
        "Events can only be deleted by their creator"
      );
    });

    it("Returns 200 and deletes the event if it belongs to the user", async () => {
      // given
      const event = await createMockEvent({ creatorId: callerUser._id });
      const eventId = event._id;

      // when
      const response = await request(app).del(`/events/${eventId}`);

      // then
      expect(response.status).toEqual(200);
      expect(response.body).toBeDefined();
      expect(response.body.message).toEqual("Event deleted");
    });
  });

  describe("Denial of service", () => {
    let callerUser: UserType & Document;
    let otherUser: UserType & Document;

    beforeEach(async () => {
      callerUser = await createMockUser({ email: "caller@doe.com" });
      otherUser = await createMockUser({ email: "other@doe.com" });

      mockedDecodeToken.mockImplementationOnce((req: any, res, next) => {
        req.token = "token";
        req.user = callerUser;
        next();
      });
    });

    it(`Returns 413 if the payload is greater than ${EVENT_SIZE}`, async () => {
      // given
      const createRandomString = (length: number): string =>
        crypto.randomBytes(length).toString("hex");

      const event = await createMockEvent({ creatorId: callerUser._id });
      const eventId = event._id;

      const body = {
        headline: createRandomString(1000),
        startDate: Date.now(),
        location: { name: "Somewhere" },
        description: createRandomString(5000),
      };

      // when
      const response = await request(app).put(`/events/${eventId}`).send(body);

      // then
      expect(response.status).toEqual(413);
      expect(response.body).toBeDefined();
      expect(response.body.error).toEqual("Payload too large");
    });

    it(`Returns 429 after ${EVENT_RPM} requests in a minute`, async () => {
      // given
      const event = await createMockEvent({ creatorId: callerUser._id });
      const eventId = event._id;

      // when
      const requestPromises = new Array(EVENT_RPM + 1)
        .fill(undefined)
        .map((_, i) => request(app).get(`/events/${eventId}`));
      const responses = await Promise.all(requestPromises);

      // then
      const validResponses = responses.filter(
        (response) => response.status === 200
      );
      const rejectedResponses = responses.filter(
        (response) => response.status === 429
      );

      expect(validResponses.length).toBeLessThanOrEqual(EVENT_RPM);
      expect(rejectedResponses.length).toBeGreaterThanOrEqual(1);
    });
  });
});
