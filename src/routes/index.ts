import express from "express";

import { environment } from "@/config";
import { Event, Subscription, User } from "@/services/db";

const router = express.Router();

/**
 * @openapi
 * /:
 *   get:
 *     description: Gets general info from the API.
 *     responses:
 *       200:
 *         description: API info.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiInfo'
 */
router.get("/", async function (req, res) {
  const logger = res.locals.logger || console;
  try {
    res.status(200).send({
      environment,
      stats: {
        events: await Event.count(),
        subscriptions: await Subscription.count(),
        users: await User.count(),
      },
    });
  } catch (error) {
    logger.error(
      `Internal server error at ${req.method} ${req.originalUrl}`,
      error
    );
    res.status(500).send({ message: "Internal server error" });
  }
});

export default router;
