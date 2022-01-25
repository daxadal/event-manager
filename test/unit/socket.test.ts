import { Socket } from "socket.io-client";

import { MINUTES_AHEAD } from "@/jobs/remind";
import {
  EventDocument,
  EventState,
  Subscription,
  UserDocument,
} from "@/services/db";
import { createToken } from "@/services/auth";
import { closeConnection, createConnection } from "@/services/db/setup";
import socketServer, { io, sendReminders } from "@/socket";

import { createSocketClient } from "test/mocks/socket-client";
import {
  clearDatabase,
  createMockEvents,
  createMockUser,
  createMockUsers,
} from "test/mocks/db";
import { socket as socketConfig } from "@/config";

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

  describe("Connection test", () => {
    beforeAll(() => {
      socketServer.listen(socketConfig.PORT);
    });

    afterAll(() => {
      socketServer.close();
    });

    it("PING-PONG communication", async () => {
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
      io.emit("PING");
      await Promise.all(promises);
    });
  });

  xdescribe("Sign in & sign out", () => {
    let socket: Socket;
    let user: UserDocument;
    beforeAll(async () => {
      socketServer.listen(socketConfig.PORT);

      user = await createMockUser();
      user.sessionToken = createToken(user);
      await user.save();

      socket = createSocketClient();
    });

    afterAll(async () => {
      await clearDatabase();
      socket.disconnect();
      socketServer.close();
    });

    it("If the client sends a 'sign-in' with an invalid token, server reponds a 'sign-in-error' message", (done) => {
      socket.on("sign-in-ok", () => {
        done(new Error("Signed in successfully instead of failing"));
      });
      socket.on("sign-in-error", () => {
        done();
      });

      socket.emit("sign-in", "token.not.valid");
    });
    it("If the client sends a 'sign-in' with a valid token, server reponds a 'sign-in-ok' message", (done) => {
      socket.on("sign-in-ok", () => {
        done();
      });
      socket.on("sign-in-error", () => {
        done(new Error("Sign in error instead of success"));
      });

      socket.emit("sign-in", user.sessionToken);
    });
    it("If the client sends a 'sign-out' with an invalid token, server reponds a 'sign-out-error' message", (done) => {
      socket.on("sign-out-ok", () => {
        done(new Error("Signed out successfully instead of failing"));
      });
      socket.on("sign-out-error", () => {
        done();
      });

      socket.emit("sign-in", user.sessionToken);
      sleep(100).then(() => socket.emit("sign-out", "token.not.valid"));
    });
    it("If the client sends a 'sign-out' with a valid token, server reponds a 'sign-out-ok' message", (done) => {
      socket.on("sign-out-ok", () => {
        done();
      });
      socket.on("sign-out-error", () => {
        done(new Error("Sign out error instead of success"));
      });

      socket.emit("sign-in", user.sessionToken);
      sleep(100).then(() => socket.emit("sign-out", user.sessionToken));
    });
  });

  xdescribe("Reminder", () => {
    const AMOUNT_OF_USERS = 4;
    const AMOUNT_OF_EVENTS = AMOUNT_OF_USERS - 1;
    let events: EventDocument[];

    let sockets: Socket[];
    let users: UserDocument[];

    beforeAll(async () => {
      socketServer.listen(socketConfig.PORT);

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

      socketServer.close();
    });

    it("Send a 'reminder' message to each user for each event", async () => {
      await sendReminders(events);

      const promises = sockets.map(
        (socket) =>
          new Promise((resolve, reject) => {
            socket.on("reminder", resolve);
            sleep(1000).then(() => reject("Reminder not received"));
          })
      );
      await Promise.all(promises);
    });
  });
});
