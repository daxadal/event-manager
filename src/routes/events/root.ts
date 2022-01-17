import { Router } from "express";
import Joi from "joi";
import { Logger } from "winston";

import { Event, EventState, format } from "@/services/db";
import { verifyToken, decodeToken } from "@/services/auth";
import { validateBody } from "@/services/validations";

export const EVENT_SIZE = "1kb";
export const EVENT_RPM = 100;

export const MAX_SUBSCRIPTIONS = 3;

// EVENTS
const router = Router();

router
  .route("/")

  /**
   * @openapi
   * /events:
   *   post:
   *     tags:
   *       - events
   *     description: Creates an event
   *     requestBody:
   *       description: Event to create
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/EventData'
   *     responses:
   *       200:
   *         description: The created event.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   description: Confirmation message
   *                 event:
   *                   $ref: '#/components/schemas/Event'
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
  .post(
    decodeToken,
    verifyToken,
    validateBody(
      Joi.object({
        headline: Joi.string().min(5).max(100).required(),
        description: Joi.string().max(500),
        startDate: Joi.date().required(),
        location: Joi.object({
          name: Joi.string().max(100),
          lat: Joi.number().min(-90).max(90),
          lon: Joi.number().min(-180).max(180),
        })
          .or("name", "lat", "lon")
          .and("lat", "lon")
          .required(),
        state: Joi.valid(...Object.values(EventState)).default(
          EventState.DRAFT
        ),
      })
    ),
    async (req: any, res) => {
      const logger: Logger | Console = (req as any).logger || console;
      try {
        const event = req.body;

        if (event.state === EventState.PUBLIC) {
          const events = await Event.find({
            state: EventState.PUBLIC,
            creatorId: req.user.id,
          });

          if (events.length > 0) {
            res.status(400).send({ message: "Public events limit exceeded" });
            return;
          }
        }

        const eventDB = await new Event({
          ...event,
          creatorId: req.user.id,
        }).save();

        res
          .status(200)
          .send({ message: "Event created", event: format(eventDB) });
      } catch (error) {
        logger.error(
          `Internal server error at ${req.method} ${req.originalUrl}`,
          error
        );
        res.status(500).send({ message: "Internal server error" });
      }
    }
  )

  /**
   * @openapi
   * /events:
   *   get:
   *     tags:
   *       - events
   *     description: Get all visible events.
   *     responses:
   *       200:
   *         description: A list of all visible events (depending on credentials, if present).
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 events:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Event'
   *       400:
   *         $ref: '#/components/responses/400'
   *       403:
   *         $ref: '#/components/responses/403'
   *       413:
   *         $ref: '#/components/responses/413'
   *       429:
   *         $ref: '#/components/responses/429'
   *       500:
   *         $ref: '#/components/responses/500'
   */
  .get(decodeToken, async (req: any, res) => {
    const logger: Logger | Console = (req as any).logger || console;
    try {
      let query;
      if (req.user)
        query = Event.find().or([
          { state: { $in: [EventState.PUBLIC, EventState.PRIVATE] } },
          { creatorId: req.user.id },
        ]);
      else query = Event.find({ state: EventState.PUBLIC });

      const events = await query.exec();

      if (events) res.status(200).send({ events: events.map(format) });
      else res.status(400).send({ message: "Event not found" });
    } catch (error) {
      logger.error(
        `Internal server error at ${req.method} ${req.originalUrl}`,
        error
      );
      res.status(500).send({ message: "Internal server error" });
    }
  });

export default router;
