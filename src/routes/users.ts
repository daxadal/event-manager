import express from "express";
import rateLimit from "express-rate-limit";
import auth from "basic-auth";
import Joi from "joi";
import { Logger } from "winston";

import * as DB from "@/services/db";
import { createToken, decodeToken, hash, verifyToken } from "@/services/auth";
import { validateBody } from "@/services/validations";

export const USER_SIZE = "512b";
export const USER_RPM = 30;

// Register / LOGIN
const usersApp = express.Router();

usersApp.use(express.json({ limit: USER_SIZE }));
usersApp.use(
  rateLimit({
    max: USER_RPM,
    windowMs: 60 * 1000, // 1 minute
    message: "Too many requests",
  })
);

usersApp.post(
  "/sign-up",
  validateBody(
    Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    })
  ),
  async (req, res) => {
    const logger: Logger | Console = (req as any).logger || console;
    try {
      const newUser = req.body;

      const oldUser = await DB.User.findOne({
        email: newUser.email,
      });

      if (oldUser) {
        res.status(400).send({ error: "Email already in use" });
        return;
      }

      const user = await new DB.User({
        name: newUser.name,
        email: newUser.email,
        hashedPassword: hash(newUser.password),
      }).save();

      const token = createToken(user);

      user.sessionToken = token;
      user.save();

      res.status(200).send({ message: "Signed up successfully", token });
    } catch (error) {
      logger.error(
        `Internal server error at ${req.method} ${req.originalUrl}`,
        error
      );
      res.status(500).send({ error: "Internal server error" });
    }
  }
);

usersApp.post("/sign-in", async (req, res) => {
  const logger: Logger | Console = (req as any).logger || console;
  try {
    const basicAuth = auth(req);

    if (!basicAuth) {
      res.status(400).send({
        error: "Credentials must be provided as Basic Auth (email:password)",
      });
      return;
    }
    const inputSchema = Joi.object({
      name: Joi.string().email().required(),
      pass: Joi.string().required(),
    });

    const { value: credentials, error } = inputSchema.validate(basicAuth);
    if (error) {
      res.status(400).send({ error: error.message });
      return;
    }

    const user = await DB.User.findOne({
      email: credentials.name,
      hashedPassword: hash(credentials.pass),
    });

    if (!user) {
      res.status(400).send({ error: "Invalid credentials" });
      return;
    }

    const token = createToken(user);

    user.sessionToken = token;
    user.save();

    res.status(200).send({ message: "Signed in successfully", token });
  } catch (error) {
    logger.error(
      `Internal server error at ${req.method} ${req.originalUrl}`,
      error
    );
    res.status(500).send({ error: "Internal server error" });
  }
});

usersApp.post("/sign-out", decodeToken, verifyToken, async (req: any, res) => {
  const logger: Logger | Console = (req as any).logger || console;
  try {
    req.user.sessionToken = undefined;
    req.user.socketId = undefined;
    await req.user.save();
    res.status(200).send({ message: "Signed out successfully" });
  } catch (error) {
    logger.error(
      `Internal server error at ${req.method} ${req.originalUrl}`,
      error
    );
    res.status(500).send({ error: "Internal server error" });
  }
});

export default usersApp;
