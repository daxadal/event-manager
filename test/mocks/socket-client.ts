import { io } from "socket.io-client";

import * as config from "@/config";

export const createSocketClient = () => {
  const socket = io(`http://localhost:${config.socket.PORT}`);

  if (config.mocha.SOCKET_VERBOSE) {
    socket.on("connect", () => {
      console.log("Client: Connection made to server: ", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Client: disconnected");
    });

    socket.on("PING", () => {
      console.log("Client PING", socket.id);
      socket.emit("PONG", socket.id);
    });

    socket.on("reminder", (reminder) => {
      console.log("Client reminder: ", reminder.message);
    });

    socket.on("sign-in-ok", () => {
      console.log("Client sign-in-ok");
    });

    socket.on("sign-in-error", () => {
      console.error("Client sign-in-error");
    });

    socket.on("sign-out-ok", () => {
      console.log("Client sign-out-ok");
    });

    socket.on("sign-out-error", () => {
      console.error("Client sign-out-error");
    });
  }
  return socket;
};
