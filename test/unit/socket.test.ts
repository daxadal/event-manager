import { Socket } from "socket.io-client";

import { MINUTES_AHEAD } from "@/services/utils";
import { EventDocument, EventState, UserDocument } from "@/services/db";
import { createToken } from "@/services/auth";
import { closeConnection, createConnection } from "@/services/db/setup";
import bree from "@/scheduler";
import { pingAll, sendReminders } from "@/socket";

const API = require("@/services/api")();
import { createSocketClient } from "test/mocks/socket-client";
import {
  clearDatabase,
  createMockEvents,
  createMockUser,
  createMockUsers,
} from "test/mocks/db";

jest.mock("@/services/auth", () => {
  const module =
    jest.requireActual<typeof import("@/services/auth")>("@/services/auth");

  return {
    ...module,
    decodeToken: jest.fn((req, res, next) => next()),
    verifyToken: jest.fn((req, res, next) => next()),
  };
});

const sleep = (millis) => new Promise((resolve) => setTimeout(resolve, millis));

xdescribe("Sockets", () => {
  beforeAll(createConnection);

  afterAll(closeConnection);

  describe("Connection", () => {
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
      await pingAll();
      await Promise.all(promises);
    });
  });

  describe("Sign in & sign out", () => {
    let socket: Socket;
    let user: UserDocument;
    beforeAll(async () => {
      user = await createMockUser();
      user.sessionToken = createToken(user);
      await user.save();

      socket = createSocketClient();
    });

    afterAll(async () => {
      await clearDatabase();
      socket.disconnect();
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
  });

  describe("Reminder", () => {
    const AMOUNT_OF_USERS = 4;
    const AMOUNT_OF_EVENTS = 4;
    let events: EventDocument[];

    let sockets: Socket[];
    let users: UserDocument[];

    beforeAll(async () => {
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

    afterAll(async () => {
      await clearDatabase();
      sockets.map((socket) => socket.disconnect());
    });

    it("Remind (direct call)", async () => {
      await sendReminders(events);

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
      bree.run("remind");

      const promises = sockets.map(
        (socket) =>
          new Promise((resolve, reject) => {
            socket.on("reminder", resolve);
            sleep(2000).then(reject);
          })
      );

      await Promise.all(promises);
    });
  });
});
