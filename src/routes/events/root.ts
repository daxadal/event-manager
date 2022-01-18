import { Router } from "express";
import Joi from "joi";
import { Logger } from "winston";

import {
  Event,
  EventDocument,
  EventState,
  format,
  UserDocument,
} from "@/services/db";
import { verifyToken, decodeToken } from "@/services/auth";
import { validateBody } from "@/services/validations";

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
    async (req, res) => {
      const logger: Logger | Console = (req as any).logger || console;
      try {
        const event = req.body;
        const user: UserDocument = (req as any).user;

        if (event.state === EventState.PUBLIC) {
          const events = await Event.find({
            state: EventState.PUBLIC,
            creatorId: user.id,
          });

          if (events.length > 0) {
            logger.info("The user has already created a public event");
            res.status(400).send({ message: "Public events limit exceeded" });
            return;
          }
        }

        const eventDB = await new Event({
          ...event,
          creatorId: user.id,
        }).save();

        logger.info("Event created");
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
  .get(decodeToken, async (req, res) => {
    const logger: Logger | Console = (req as any).logger || console;
    try {
      const user: UserDocument = (req as any).user;

      let events: EventDocument[];
      if (user)
        events = await Event.find().or([
          { state: { $in: [EventState.PUBLIC, EventState.PRIVATE] } },
          { creatorId: user.id },
        ]);
      else events = await Event.find({ state: EventState.PUBLIC });

      logger.info(`Events found: ${events.length}`);
      res.status(200).send({ events: events.map(format) });
    } catch (error) {
      logger.error(
        `Internal server error at ${req.method} ${req.originalUrl}`,
        error
      );
      res.status(500).send({ message: "Internal server error" });
    }
  });

export default router;
