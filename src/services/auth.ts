import crypto from "crypto";
import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { Logger } from "winston";
import * as DB from "./db";

import {
  bree as breeConfig,
  jwt as jwtConfig,
  pass as passConfig,
} from "@/config";
import { getMinuteInterval } from "@/services/utils";

const TOKEN_EXPIRATION = "8h";
const BREE_EXPIRATION = "30s";

export const hash = (pass) =>
  crypto.createHmac("sha256", passConfig.SECRET).update(pass).digest("hex");

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
        res.status(403).send({ error: "Invalid session token" });
        return;
      }

      try {
        req.user = await DB.User.findById(decoded.id);
      } catch (error) {
        logger.error(
          `Internal server error at ${req.method} ${req.originalUrl}`,
          error
        );
        res.status(500).send({ error: "Internal server error" });
        return;
      }

      if (!req.user || req.user.sessionToken !== req.token)
        res.status(403).send({ error: "Session token expired" });
      else next();
    }
  } catch (error) {
    logger.error(
      `Internal server error at ${req.method} ${req.originalUrl}`,
      error
    );
    res.status(500).send({ error: "Internal server error" });
  }
};

export const verifyToken: RequestHandler = async (req: any, res, next) => {
  if (!req.user) res.status(401).send({ error: "Unauthorized" });
  else next();
};

export const checkBreeToken: RequestHandler = async (req: any, res, next) => {
  const logger: Logger | Console = (req as any).logger || console;
  try {
    const bearerHeader = req.get("Authorization");
    const match = /^[Bb]earer (.+)$/.exec(bearerHeader);

    if (!match) {
      res.status(404).send({ error: "Endpoint not found" });
    } else {
      // eslint-disable-next-line prefer-destructuring
      req.token = match[1];

      try {
        req.dates = jwt.verify(match[1], breeConfig.BREE_SECRET);
      } catch (error) {
        logger.error(
          `Internal server error at ${req.method} ${req.originalUrl}`,
          error
        );
        res.status(403).send({ error: "Invalid session token" });
        return;
      }

      if (!req.dates || !req.dates.start || !req.dates.end)
        res.status(403).send({ error: "Invalid session token" });
      else next();
    }
  } catch (error) {
    logger.error(
      `Internal server error at ${req.method} ${req.originalUrl}`,
      error
    );
    res.status(500).send({ error: "Internal server error" });
  }
};

export function createBreeToken() {
  const { start, end, now } = getMinuteInterval();
  return jwt.sign({ start, end, now }, breeConfig.BREE_SECRET, {
    expiresIn: BREE_EXPIRATION,
  });
}

export function createToken(user) {
  return jwt.sign({ id: String(user.id) }, jwtConfig.TOKEN_SECRET, {
    expiresIn: TOKEN_EXPIRATION,
  });
}
