import http from "http";
import { Server } from "socket.io";

import * as DB from "@/services/db";
import { getLogger } from "@/services/winston";

const httpServer = http.createServer();
export const io = new Server(httpServer);

const logger = getLogger("socket-server");

io.on("connection", (socket) => {
  logger.debug(`Server: Connection made to server: ${socket.id}`);

  socket.on("disconnect", () => {
    logger.debug("Server: user disconnected");
  });

  socket.on("sign-in", async (sessionToken) => {
    const user = await DB.User.findOne({
      sessionToken,
    });
    if (user) {
      user.socketId = socket.id;
      await user.save();
      logger.debug(`Server: sign-in ${socket.id} ${user.name} ${user.id}`);
      socket.emit("sign-in-ok");
    } else {
      logger.debug("Server: failed to sign-in", {
        socketId: socket.id,
        sessionToken,
      });
      socket.emit("sign-in-error");
    }
  });
  socket.on("sign-out", async (sessionToken) => {
    const user = await DB.User.findOne({
      sessionToken,
    });
    if (user && user.socketId === socket.id) {
      user.socketId = null;
      logger.debug(`Server: sign-out ${socket.id} ${user.name} ${user.id}`);
      socket.emit("sign-out-ok");
    } else {
      logger.debug("Server: failed to sign-out", {
        socketId: socket.id,
        sessionToken,
      });
      socket.emit("sign-out-error");
    }
  });
});

function format(event, user, sub) {
  return {
    message: `Hi ${
      user.name
    }! You have an event at ${event.startDate.toLocaleString()}: "${
      event.headline
    }"`,
    event: DB.format(event),
    subscription: {
      subscriptionDate: sub.subscriptionDate,
      comment: sub.comment,
    },
  };
}

export async function sendReminders(events) {
  const all = await io.fetchSockets();
  logger.info("All sockets:", { socketIds: all.map((s) => s.id) });
  const subscriptions = await DB.Subscription.find().in(
    "eventId",
    events.map((event) => event.id)
  );
  logger.info(`subscriptions.length ${subscriptions.length}`);
  const users = await DB.User.find().in(
    "_id",
    subscriptions.map((sub) => sub.subscriberId)
  );
  subscriptions.forEach(async (sub) => {
    const event = events.find((e) => e.id === String(sub.eventId));
    const user = users.find((u) => u.id === String(sub.subscriberId));
    const sockets = await io.in(user.socketId).fetchSockets();
    sockets.map((socket) => socket.emit("reminder", format(event, user, sub)));
  });
}

export default httpServer;
