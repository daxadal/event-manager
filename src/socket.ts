import http from "http";
import { Server } from "socket.io";

import { getLogger } from "@/services/winston";
import {
  EventDocument,
  EventType,
  format,
  Subscription,
  SubscriptionDocument,
  User,
  UserDocument,
} from "@/services/db";
import { socket } from "@/config";

const httpServer = http.createServer();
export const io = new Server(httpServer, {
  cors: {
    origin: socket.CORS_ORIGINS.split(","),
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

const logger = getLogger("socket-server");

io.on("connection", (socket) => {
  logger.debug(`Server: Connection made to server: ${socket.id}`);

  socket.on("disconnect", () => {
    logger.debug("Server: user disconnected");
  });

  socket.on("sign-in", async (sessionToken, callback) => {
    const user = await User.findOne({
      sessionToken,
    });
    if (user) {
      user.socketId = socket.id;
      await user.save();
      logger.debug(`Server: sign-in ${socket.id} ${user.name} ${user.id}`);
      callback("sign-in-ok");
    } else {
      logger.debug("Server: failed to sign-in", {
        socketId: socket.id,
        sessionToken,
      });
      callback("sign-in-error");
    }
  });
  socket.on("sign-out", async (sessionToken, callback) => {
    const user = await User.findOne({
      sessionToken,
    });
    if (user && user.socketId === socket.id) {
      user.socketId = null;
      logger.debug(`Server: sign-out ${socket.id} ${user.name} ${user.id}`);
      callback("sign-out-ok");
    } else {
      logger.debug("Server: failed to sign-out", {
        socketId: socket.id,
        sessionToken,
      });
      callback("sign-out-error");
    }
  });
});

interface Reminder {
  message: string;
  event: { id: string } & EventType;
  subscription: {
    subscriptionDate: Date;
    comment: string;
  };
}

function formatReminder(
  event: EventDocument,
  user: UserDocument,
  sub: SubscriptionDocument
): Reminder {
  return {
    message: `Hi ${
      user.name
    }! You have an event at ${event.startDate.toLocaleString()}: "${
      event.headline
    }"`,
    event: format(event),
    subscription: {
      subscriptionDate: sub.subscriptionDate,
      comment: sub.comment,
    },
  };
}

export async function sendReminders(events: EventDocument[]): Promise<void> {
  const all = await io.fetchSockets();
  logger.info("All sockets:", { socketIds: all.map((s) => s.id) });
  const subscriptions = await Subscription.find().in(
    "eventId",
    events.map((event) => event.id)
  );
  logger.info(`subscriptions.length ${subscriptions.length}`);
  const users = await User.find().in(
    "_id",
    subscriptions.map((sub) => sub.subscriberId)
  );
  subscriptions.forEach(async (sub) => {
    const event = events.find((e) => e.id === String(sub.eventId));
    const user = users.find((u) => u.id === String(sub.subscriberId));
    const sockets = await io.in(user.socketId).fetchSockets();
    sockets.map((socket) =>
      socket.emit("reminder", formatReminder(event, user, sub))
    );
  });
}

export default httpServer;
