import { Router } from "express";
import Joi from "joi";
import { Logger } from "winston";

import {
  Event,
  EventState,
  format,
  loadEvent,
  Subscription,
} from "@/services/db";
import { verifyToken, decodeToken } from "@/services/auth";
import {
  OBJECT_ID_REGEX,
  validateBody,
  validatePath,
} from "@/services/validations";

const router = Router();

router
  .route("/:eventId(\\w+)")
  .all(
    validatePath(
      Joi.object({
        eventId: Joi.string().pattern(OBJECT_ID_REGEX),
      })
    )
  )

  /**
   * @openapi
   * /events/{eventId}:
   *   get:
   *     tags:
   *       - events
   *     description: Get an event by id.
   *     parameters:
   *       - $ref: '#/components/parameters/eventId'
   *     responses:
   *       200:
   *         description: The requested event.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 event:
   *                   $ref: '#/components/schemas/Event'
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
  .get(decodeToken, loadEvent, async (req: any, res) => {
    const logger: Logger | Console = (req as any).logger || console;
    try {
      res.status(200).send({ event: format(req.event) });
    } catch (error) {
      logger.error(
        `Internal server error at ${req.method} ${req.originalUrl}`,
        error
      );
      res.status(500).send({ message: "Internal server error" });
    }
  })

  /**
   * @openapi
   * /events/{eventId}:
   *   put:
   *     tags:
   *       - events
   *     description: Updates an event
   *     parameters:
   *       - $ref: '#/components/parameters/eventId'
   *     requestBody:
   *       description: Event to create
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/EventData'
   *     responses:
   *       200:
   *         description: The updated event.
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
  .put(
    decodeToken,
    verifyToken,
    validateBody(
      Joi.object({
        headline: Joi.string().min(5).max(100),
        description: Joi.string().max(500),
        startDate: Joi.date(),
        location: Joi.object({
          name: Joi.string().max(100),
          lat: Joi.number().min(-90).max(90),
          lon: Joi.number().min(-180).max(180),
        })
          .or("name", "lat", "lon")
          .and("lat", "lon"),
        state: Joi.valid(...Object.values(EventState)),
      })
    ),
    loadEvent,
    async (req: any, res) => {
      const logger: Logger | Console = (req as any).logger || console;
      try {
        const newEvent = req.body;

        if (String(req.event.creatorId) !== req.user.id) {
          res
            .status(403)
            .send({ message: "Events can only be edited by their creator" });
          return;
        }

        if (
          req.event.state !== EventState.PUBLIC &&
          newEvent.state === EventState.PUBLIC
        ) {
          const events = await Event.find({
            state: EventState.PUBLIC,
            creatorId: req.user.id,
          });

          if (events.length > 0) {
            res.status(400).send({ message: "Public events limit exceeded" });
          }
        }

        if (newEvent.headline) req.event.headline = newEvent.headline;
        if (newEvent.description) req.event.description = newEvent.description;
        if (newEvent.startDate) req.event.startDate = newEvent.startDate;
        if (newEvent.location) req.event.location = newEvent.location;
        if (newEvent.state) req.event.state = newEvent.state;

        req.event = await req.event.save();

        if (req.event)
          res
            .status(200)
            .send({ message: "Event updated", event: format(req.event) });
        else res.status(400).send({ message: "Event not found" });
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
   * /events/{eventId}:
   *   delete:
   *     tags:
   *       - events
   *     description: Deleted an event by id.
   *     parameters:
   *       - $ref: '#/components/parameters/eventId'
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
  .delete(decodeToken, verifyToken, loadEvent, async (req: any, res) => {
    const logger: Logger | Console = (req as any).logger || console;
    try {
      if (String(req.event.creatorId) !== req.user.id) {
        res
          .status(403)
          .send({ message: "Events can only be deleted by their creator" });
        return;
      }

      await req.event.delete();

      await Subscription.deleteMany({ eventId: req.event.id }).exec();

      if (req.event) res.status(200).send({ message: "Event deleted" });
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
