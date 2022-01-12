/* global describe xdescribe it before beforeEach after afterEach */

import assert from "assert";
import request from "supertest";
import { mocked } from "ts-jest/utils";

import * as config from "@/config";
import { MINUTES_AHEAD } from "@/services/utils";
import { EventDocument, EventState, UserDocument } from "@/services/db";
import { createToken, decodeToken } from "@/services/auth";
import { closeConnection, createConnection } from "@/services/db/setup";

const API = require("@/services/api")();
import { generateTokens, generateEvents } from "test/utils";
import { createSocketClient } from "test/mocks/socket-client";
import {
  clearDatabase,
  createMockEvents,
  createMockUser,
  createMockUsers,
} from "test/mocks/db";
import { Socket } from "socket.io-client";

jest.mock("@/services/auth", () => {
  const module =
    jest.requireActual<typeof import("@/services/auth")>("@/services/auth");

  return {
    ...module,
    decodeToken: jest.fn((req, res, next) => next()),
    verifyToken: jest.fn((req, res, next) => next()),
  };
});

const mockedDecodeToken = mocked(decodeToken, true);

const sleep = (millis) => new Promise((resolve) => setTimeout(resolve, millis));

const mdescribe = config.api.DEV ? describe : xdescribe;

xdescribe("Sockets", () => {
  beforeAll(createConnection);

  beforeEach(jest.clearAllMocks);

  afterEach(clearDatabase);

  afterAll(closeConnection);

  mdescribe("Connection (DEV API required)", () => {
    it("PING all", async () => {
      const sockets = Array(8).map(createSocketClient);

      const promises = sockets.map(
        (socket) =>
          new Promise((resolve, reject) => {
            socket.on("PING", () => {
              socket.disconnect();
              resolve(undefined);
            });
            sleep(1000).then(() => {
              reject();
            });
          })
      );
      await API.Dev.ping();
      await Promise.all(promises);
    });
  });

  describe("Sign in & sign out", () => {
    let socket: Socket;
    let user: UserDocument;
    beforeEach(async () => {
      user = await createMockUser();
      user.sessionToken = createToken(user);
      await user.save();

      socket = createSocketClient();
    });

    it("FAIL - Token not valid on sign in", (done) => {
      socket.emit("sign-in", "token.not.valid");

      socket.on("sign-in-ok", () => {
        done(new Error("Signed in successfully"));
      });
      socket.on("sign-in-error", () => {
        done();
      });
    });
    it("OK - Valid sign in", (done) => {
      socket.emit("sign-in", user.sessionToken);

      socket.on("sign-in-ok", () => {
        done();
      });
      socket.on("sign-in-error", () => {
        done(new Error("Sign in error"));
      });
    });
    it("FAIL - Token not valid on sign out", (done) => {
      socket.emit("sign-in", user.sessionToken);
      sleep(200).then(() => socket.emit("sign-out", "token.not.valid"));

      socket.on("sign-out-ok", () => {
        done(new Error("Signed out successfully"));
      });
      socket.on("sign-out-error", () => {
        done();
      });
    });
    it("OK - Valid sign out", (done) => {
      socket.emit("sign-in", user.sessionToken);
      sleep(200).then(() => socket.emit("sign-out", user.sessionToken));

      socket.on("sign-out-ok", () => {
        done();
      });
      socket.on("sign-out-error", () => {
        done(new Error("Sign out error"));
      });
    });

    afterEach(() => {
      socket.disconnect();
    });
  });

  mdescribe("Reminder (DEV API required)", () => {
    const AMOUNT_OF_USERS = 4;
    const AMOUNT_OF_EVENTS = 4;
    let events: EventDocument[];

    let sockets: Socket[];
    let users: UserDocument[];

    beforeEach(async () => {
      users = await createMockUsers(AMOUNT_OF_USERS);
      users.forEach((user) => {
        user.sessionToken = createToken(user);
        return user.save();
      });

      const date = new Date();
      date.setMinutes(date.getMinutes() + MINUTES_AHEAD);

      events = await createMockEvents(AMOUNT_OF_EVENTS, {
        startDate: date,
        state: EventState.PRIVATE,
        creatorId: users[AMOUNT_OF_USERS - 1].id,
      });

      sockets = users.slice(0, AMOUNT_OF_USERS - 1).map((user) => {
        const socket = createSocketClient();
        socket.emit("sign-in", user.sessionToken);
        return socket;
      });

      API.setToken(users[0].sessionToken);
      await API.Events.subscribe(events[0].id);
      await API.Events.subscribe(events[1].id);
      await API.Events.subscribe(events[2].id);
      await API.Events.subscribe(events[3].id);

      API.setToken(users[1].sessionToken);
      await API.Events.subscribe(events[0].id);
      await API.Events.subscribe(events[1].id);

      API.setToken(users[2].sessionToken);
      await API.Events.subscribe(events[0].id);
      await API.Events.subscribe(events[2].id);
    });

    it("Remind (direct call)", async () => {
      const response = await API.Dev.remind();
      assert.strictEqual(response.status, 200);
      const promises = sockets.map(
        (socket) =>
          new Promise((resolve, reject) => {
            socket.on("reminder", resolve);
            sleep(2000).then(reject);
          })
      );
      await Promise.all(promises);
    });

    it("Remind (using bree)", async () => {
      const response = await API.Dev.remindBree();
      assert.strictEqual(response.status, 200);
      const promises = sockets.map(
        (socket) =>
          new Promise((resolve, reject) => {
            socket.on("reminder", resolve);
            sleep(2000).then(reject);
          })
      );

      await Promise.all(promises);
    });

    afterEach(() => {
      sockets.map((socket) => socket.disconnect());
    });
  });
});