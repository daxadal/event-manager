import { Router } from "express";
import Joi from "joi";
import { Logger } from "winston";

import { format, loadEvent, Subscription } from "@/services/db";
import { verifyToken, decodeToken } from "@/services/auth";
import {
  OBJECT_ID_REGEX,
  validateBody,
  validatePath,
} from "@/services/validations";

export const MAX_SUBSCRIPTIONS = 3;

const router = Router();

/**
 * @openapi
 * /events/{eventId}/subscribe:
 *   post:
 *     tags:
 *       - subscriptions
 *     description: Subscribes the authenticated user to an event
 *     parameters:
 *       - $ref: '#/components/parameters/eventId'
 *     requestBody:
 *       description: Comment to attach to the subscription
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubscriptionData'
 *     responses:
 *       200:
 *         description: The created subscription.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Confirmation message
 *                 subscription:
 *                   $ref: '#/components/schemas/Subscription'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: More info about the error
 *                 subscription:
 *                   description: Preexisting subscription (if present)
 *                   $ref: '#/components/schemas/Subscription'
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
router.route("/:eventId(\\w+)/subscribe").post(
  decodeToken,
  verifyToken,
  validatePath(
    Joi.object({
      eventId: Joi.string().pattern(OBJECT_ID_REGEX),
    })
  ),
  validateBody(
    Joi.object({
      comment: Joi.string().max(100),
    }).optional()
  ),
  loadEvent,
  async (req: any, res) => {
    const logger: Logger | Console = (req as any).logger || console;
    try {
      const params = req.body;

      if (String(req.event.creatorId) === req.user.id) {
        res
          .status(400)
          .send({ message: "You can't subscribe to your own events" });
        return;
      }

      const subscriptions = await Subscription.find({
        subscriberId: req.user.id,
      });

      const oldSubscription = subscriptions.find(
        (sub) => String(sub.eventId) === req.event.id
      );

      if (oldSubscription) {
        res.status(400).send({
          message: "You already have subscribed to this event",
          subscription: format(oldSubscription),
        });
      } else if (subscriptions.length >= MAX_SUBSCRIPTIONS) {
        res.status(400).send({
          message: "Subscribed events limit exceeded",
        });
      } else {
        const subscription = await new Subscription({
          eventId: req.event.id,
          subscriberId: req.user.id,
          subscriptionDate: Date.now(),
          comment: params.comment,
        }).save();

        res.status(200).send({
          message: "Subscribed successfully",
          subscription: format(subscription),
        });
      }
    } catch (error) {
      logger.error(
        `Internal server error at ${req.method} ${req.originalUrl}`,
        error
      );
      res.status(500).send({ message: "Internal server error" });
    }
  }
);

export default router;
