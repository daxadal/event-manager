import { io } from "socket.io-client";

import * as config from "@/config";
import { getLogger } from "@/services/winston";

const logger = getLogger("mocks/socket-client");

export const createSocketClient = () => {
  const socket = io(`http://localhost:${config.socket.PORT}`);

  socket.on("connect", () => {
    logger.debug("Client: Connection made to server: ", socket.id);
  });

  socket.on("disconnect", () => {
    logger.debug("Client: disconnected");
  });

  socket.on("PING", () => {
    logger.debug("Client PING", socket.id);
    socket.emit("PONG", socket.id);
  });

  socket.on("reminder", (reminder) => {
    logger.debug("Client reminder: ", reminder.message);
  });

  socket.on("sign-in-ok", () => {
    logger.debug("Client sign-in-ok");
  });

  socket.on("sign-in-error", () => {
    logger.error("Client sign-in-error");
  });

  socket.on("sign-out-ok", () => {
    logger.debug("Client sign-out-ok");
  });

  socket.on("sign-out-error", () => {
    logger.error("Client sign-out-error");
  });
  return socket;
};
