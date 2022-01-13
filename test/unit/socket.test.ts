import { Socket } from "socket.io-client";

import { MINUTES_AHEAD } from "@/services/utils";
import {
  EventDocument,
  EventState,
  Subscription,
  UserDocument,
} from "@/services/db";
import { createToken } from "@/services/auth";
import { closeConnection, createConnection } from "@/services/db/setup";
import bree from "@/scheduler";
import { pingAll, sendReminders } from "@/socket";

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

const sleep = (millis: number) =>
  new Promise((resolve) => setTimeout(resolve, millis));

describe("Sockets", () => {
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
            sleep(100).then(() => {
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
      socket.on("sign-in-ok", () => {
        done(new Error("Signed in successfully"));
      });
      socket.on("sign-in-error", () => {
        done();
      });

      socket.emit("sign-in", "token.not.valid");
    });
    it("OK - Valid sign in", (done) => {
      socket.on("sign-in-ok", () => {
        done();
      });
      socket.on("sign-in-error", () => {
        done(new Error("Sign in error"));
      });

      socket.emit("sign-in", user.sessionToken);
    });
    it("FAIL - Token not valid on sign out", (done) => {
      socket.on("sign-out-ok", () => {
        done(new Error("Signed out successfully"));
      });
      socket.on("sign-out-error", () => {
        done();
      });

      socket.emit("sign-in", user.sessionToken);
      sleep(100).then(() => socket.emit("sign-out", "token.not.valid"));
    });
    it("OK - Valid sign out", (done) => {
      socket.on("sign-out-ok", () => {
        done();
      });
      socket.on("sign-out-error", () => {
        done(new Error("Sign out error"));
      });

      socket.emit("sign-in", user.sessionToken);
      sleep(100).then(() => socket.emit("sign-out", user.sessionToken));
    });
  });

  describe("Reminder", () => {
    const AMOUNT_OF_USERS = 4;
    const AMOUNT_OF_EVENTS = AMOUNT_OF_USERS - 1;
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

      const subscribers = users.slice(0, AMOUNT_OF_USERS - 1);

      sockets = subscribers.map((user) => {
        const socket = createSocketClient();
        socket.emit("sign-in", user.sessionToken);
        return socket;
      });

      const subscriptionPromises = subscribers.map((user, i) =>
        new Subscription({
          eventId: events[i].id,
          subscriberId: user.id,
          subscriptionDate: Date.now(),
        }).save()
      );

      await Promise.all(subscriptionPromises);
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
            sleep(100).then(reject);
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
            sleep(100).then(reject);
          })
      );

      await Promise.all(promises);
    });
  });
});
