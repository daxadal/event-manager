import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { Logger } from "winston";
import * as DB from "./db";

import { jwt as jwtConfig } from "@/config";

const TOKEN_EXPIRATION = "8h";

export const decodeToken: RequestHandler = async (req: any, res, next) => {
  const logger: Logger | Console = (req as any).logger || console;
  try {
    const bearerHeader = req.get("Authorization");
    const match = /^[Bb]earer (.+)$/.exec(bearerHeader);

    if (!match) {
      // No Bearer token found. No decoding necessary
      next();
    } else {
      // eslint-disable-next-line prefer-destructuring
      req.token = match[1];

      let decoded;
      try {
        decoded = jwt.verify(match[1], jwtConfig.TOKEN_SECRET);
      } catch (error) {
        logger.error(
          `Internal server error at ${req.method} ${req.originalUrl}`,
          error
        );
        res.status(403).send({ message: "Invalid session token" });
        return;
      }

      try {
        req.user = await DB.User.findById(decoded.id);
      } catch (error) {
        logger.error(
          `Internal server error at ${req.method} ${req.originalUrl}`,
          error
        );
        res.status(500).send({ message: "Internal server error" });
        return;
      }

      if (!req.user || req.user.sessionToken !== req.token)
        res.status(403).send({ message: "Session token expired" });
      else next();
    }
  } catch (error) {
    logger.error(
      `Internal server error at ${req.method} ${req.originalUrl}`,
      error
    );
    res.status(500).send({ message: "Internal server error" });
  }
};

export const verifyToken: RequestHandler = async (req: any, res, next) => {
  if (!req.user) res.status(401).send({ message: "Unauthorized" });
  else next();
};

export function createToken(user) {
  return jwt.sign({ id: String(user.id) }, jwtConfig.TOKEN_SECRET, {
    expiresIn: TOKEN_EXPIRATION,
  });
}
