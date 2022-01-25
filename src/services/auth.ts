import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { Logger } from "winston";

import { jwt as jwtConfig } from "@/config";
import { User, UserDocument } from "@/services/db";

const TOKEN_EXPIRATION = "8h";

export const addUserToRequest: RequestHandler = async (req, res, next) => {
  const logger: Logger | Console = (req as any).logger || console;
  try {
    const bearerHeader = req.get("Authorization");
    const match = /^Bearer (.+)$/i.exec(bearerHeader);

    if (!match) {
      next();
    } else {
      const [, token] = match;

      let decoded: any;
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

      let user: UserDocument;
      try {
        user = await User.findById(decoded.id);
      } catch (error) {
        logger.error(
          `Internal server error at ${req.method} ${req.originalUrl}`,
          error
        );
        res.status(500).send({ message: "Internal server error" });
        return;
      }

      if (!user || user.sessionToken !== token) {
        logger.info("Session token expired");
        res.status(403).send({ message: "Session token expired" });
      } else {
        (req as any).token = token;
        (req as any).user = user;
        next();
      }
    }
  } catch (error) {
    logger.error(
      `Internal server error at ${req.method} ${req.originalUrl}`,
      error
    );
    res.status(500).send({ message: "Internal server error" });
  }
};

export const ensureLoggedIn: RequestHandler = async (req: any, res, next) => {
  if (!req.user) {
    const logger: Logger | Console = (req as any).logger || console;
    logger.info("Session token expired");
    res.status(401).send({ message: "Unauthorized" });
  } else next();
};

export function createToken(userId: string) {
  return jwt.sign({ id: userId }, jwtConfig.TOKEN_SECRET, {
    expiresIn: TOKEN_EXPIRATION,
  });
}
