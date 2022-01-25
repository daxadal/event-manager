import { Router } from "express";
import Joi from "joi";
import { Logger } from "winston";

import {
  Event,
  EventDocument,
  EventState,
  format,
  loadEvent,
  Subscription,
  UserDocument,
} from "@/services/db";
import { ensureLoggedIn, addUserToRequest } from "@/services/auth";
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
  .get(addUserToRequest, loadEvent, async (req: any, res) => {
    const logger: Logger | Console = (req as any).logger || console;
    try {
      const event: EventDocument = (req as any).event;
      res.status(200).send({ event: format(event) });
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
    addUserToRequest,
    ensureLoggedIn,
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
        const user: UserDocument = (req as any).user;
        const event: EventDocument = (req as any).event;
        const newEvent = req.body;

        if (String(event.creatorId) !== user.id) {
          logger.info("Events can only be edited by their creator");
          res
            .status(403)
            .send({ message: "Events can only be edited by their creator" });
          return;
        }

        if (
          event.state !== EventState.PUBLIC &&
          newEvent.state === EventState.PUBLIC
        ) {
          const events = await Event.find({
            state: EventState.PUBLIC,
            creatorId: user.id,
          });

          if (events.length > 0) {
            logger.info("Public events limit exceeded");
            res.status(400).send({ message: "Public events limit exceeded" });
          }
        }

        if (newEvent.headline) event.headline = newEvent.headline;
        if (newEvent.description) event.description = newEvent.description;
        if (newEvent.startDate) event.startDate = newEvent.startDate;
        if (newEvent.location) event.location = newEvent.location;
        if (newEvent.state) event.state = newEvent.state;

        await event.save();

        logger.info("Event updated");
        res
          .status(200)
          .send({ message: "Event updated", event: format(event) });
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
  .delete(
    addUserToRequest,
    ensureLoggedIn,
    loadEvent,
    async (req: any, res) => {
      const logger: Logger | Console = (req as any).logger || console;
      try {
        const user: UserDocument = (req as any).user;
        const event: EventDocument = (req as any).event;

        if (String(event.creatorId) !== user.id) {
          logger.info("Events can only be deleted by their creator");
          res
            .status(403)
            .send({ message: "Events can only be deleted by their creator" });
          return;
        }

        await event.delete();

        await Subscription.deleteMany({ eventId: event.id }).exec();

        logger.info("Event deleted");
        res.status(200).send({ message: "Event deleted" });
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
