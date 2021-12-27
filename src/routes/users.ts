import { hash, compare } from "bcrypt";
import { json, Router } from "express";
import rateLimit from "express-rate-limit";
import Joi from "joi";
import { Logger } from "winston";

import { User } from "@/services/db";
import { createToken, decodeToken, verifyToken } from "@/services/auth";
import { validateBody } from "@/services/validations";
import { getLoggerMiddleware } from "@/services/winston";

export const USER_SIZE = "512b";
export const USER_RPM = 30;

export const HASH_ROUNDS = 10;

// Register / LOGIN
const router = Router();

router.use(getLoggerMiddleware("routes/users"));

router.use(json({ limit: USER_SIZE }));
router.use(
  rateLimit({
    max: USER_RPM,
    windowMs: 60 * 1000, // 1 minute
    message: "Too many requests",
  })
);

/**
 * @openapi
 * /users/sign-up:
 *   post:
 *     tags:
 *       - users
 *     description: Registers an user
 *     requestBody:
 *       description: Necessary data to register
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignUpData'
 *     responses:
 *       200:
 *         description: A confirmation message and a token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Confirmation message
 *                 token:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/400'
 *       413:
 *         $ref: '#/components/responses/413'
 *       429:
 *         $ref: '#/components/responses/429'
 *       500:
 *         $ref: '#/components/responses/500'
 */
router.post(
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
      const { name, email, password } = req.body;

      const oldUser = await User.findOne({ email });

      if (oldUser) {
        res.status(400).send({ message: "Email already in use" });
        return;
      }

      const user = await new User({
        name,
        email,
        hashedPassword: await hash(password, HASH_ROUNDS),
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
      res.status(500).send({ message: "Internal server error" });
    }
  }
);

/**
 * @openapi
 * /users/sign-in:
 *   post:
 *     tags:
 *       - users
 *     description: Logs in an user
 *     requestBody:
 *       description: Necessary data to login
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignInData'
 *     responses:
 *       200:
 *         description: A confirmation message and a token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Confirmation message
 *                 token:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/400'
 *       413:
 *         $ref: '#/components/responses/413'
 *       429:
 *         $ref: '#/components/responses/429'
 *       500:
 *         $ref: '#/components/responses/500'
 */
router.post(
  "/sign-in",
  validateBody(
    Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    })
  ),
  async (req, res) => {
    const logger: Logger | Console = (req as any).logger || console;
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });

      if (!user || !(await compare(password, user.hashedPassword))) {
        res.status(400).send({ message: "Invalid credentials" });
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
      res.status(500).send({ message: "Internal server error" });
    }
  }
);

/**
 * @openapi
 * /users/sign-out:
 *   post:
 *     tags:
 *       - users
 *     description: Logs out an user
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Generic200'
 *       400:
 *         $ref: '#/components/responses/400'
 *       401:
 *         $ref: '#/components/responses/401'
 *       403:
 *         $ref: '#/components/responses/403'
 *       413:
 *         $ref: '#/components/responses/413'
 *       429:
 *         $ref: '#/components/responses/429'
 *       500:
 *         $ref: '#/components/responses/500'
 */
router.post("/sign-out", decodeToken, verifyToken, async (req: any, res) => {
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
    res.status(500).send({ message: "Internal server error" });
  }
});

export default router;
