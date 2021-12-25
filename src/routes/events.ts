import express from "express";
import rateLimit from "express-rate-limit";
import Joi from "joi";
import { Logger } from "winston";

import * as DB from "@/services/db";
import { verifyToken, decodeToken } from "@/services/auth";
import {
  OBJECT_ID_REGEX,
  validateBody,
  validatePath,
} from "@/services/validations";

export const EVENT_SIZE = "1kb";
export const EVENT_RPM = 100;

// EVENTS
const eventsApp = express.Router();

eventsApp.use(express.json({ limit: EVENT_SIZE }));
eventsApp.use(express.urlencoded({ extended: true }));
eventsApp.use(
  rateLimit({
    max: EVENT_RPM,
    windowMs: 60 * 1000, // 1 minute
    message: "Too many requests",
  })
);

function isVisible(event, user) {
  switch (event.state) {
    case "public":
      return true;
    case "private":
      return Boolean(user);
    case "draft":
      return Boolean(user) && user.id === String(event.creatorId);
    default:
      throw new Error("Event has an unexpected state");
  }
}

async function loadEvent(req, res, next) {
  const logger: Logger | Console = (req as any).logger || console;
  const { eventId } = req.params;
  try {
    req.event = await DB.Event.findById(eventId).exec();

    if (req.event && isVisible(req.event, req.user)) next();
    else res.status(400).send({ error: "Event not found" });
  } catch (error) {
    logger.error(
      `Internal server error at ${req.method} ${req.originalUrl}`,
      error
    );
    res.status(500).send({ error: "Internal server error" });
  }
}

eventsApp
  .route("/")
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
        state: Joi.valid("draft", "public", "private").default("draft"),
      })
    ),
    async (req: any, res) => {
      const logger: Logger | Console = (req as any).logger || console;
      try {
        const event = req.body;

        if (event.state === "public") {
          const events = await DB.Event.find({
            state: "public",
            creatorId: req.user.id,
          });

          if (events.length > 0) {
            res.status(400).send({ error: "Public events limit exceeded" });
            return;
          }
        }

        const eventDB = await new DB.Event({
          ...event,
          creatorId: req.user.id,
        }).save();

        res
          .status(200)
          .send({ message: "Event created", event: DB.format(eventDB) });
      } catch (error) {
        logger.error(
          `Internal server error at ${req.method} ${req.originalUrl}`,
          error
        );
        res.status(500).send({ error: "Internal server error" });
      }
    }
  )
  .get(decodeToken, async (req: any, res) => {
    const logger: Logger | Console = (req as any).logger || console;
    try {
      let query;
      if (req.user)
        query = DB.Event.find().or([
          { state: { $in: ["public", "private"] } },
          { creatorId: req.user.id },
        ]);
      else query = DB.Event.find({ state: "public" });

      const events = await query.exec();

      if (events) res.status(200).send({ events: events.map(DB.format) });
      else res.status(400).send({ error: "Event not found" });
    } catch (error) {
      logger.error(
        `Internal server error at ${req.method} ${req.originalUrl}`,
        error
      );
      res.status(500).send({ error: "Internal server error" });
    }
  });

eventsApp
  .route("/:eventId(\\w+)")
  .all(
    validatePath(
      Joi.object({
        eventId: Joi.string().pattern(OBJECT_ID_REGEX),
      })
    )
  )
  .get(decodeToken, loadEvent, async (req: any, res) => {
    const logger: Logger | Console = (req as any).logger || console;
    try {
      res.status(200).send({ event: DB.format(req.event) });
    } catch (error) {
      logger.error(
        `Internal server error at ${req.method} ${req.originalUrl}`,
        error
      );
      res.status(500).send({ error: "Internal server error" });
    }
  })
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
        state: Joi.valid("draft", "public", "private"),
      })
    ),
    loadEvent,
    async (req: any, res) => {
      const logger: Logger | Console = (req as any).logger || console;
      try {
        const newEvent = req.body;

        if (String(req.event.creatorId) !== req.user.id) {
          res
            .status(400)
            .send({ error: "Events can only be edited by their creator" });
          return;
        }

        if (req.event.state !== "public" && newEvent.state === "public") {
          const events = await DB.Event.find({
            state: "public",
            creatorId: req.user.id,
          });

          if (events.length > 0) {
            res.status(400).send({ error: "Public events limit exceeded" });
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
            .send({ message: "Event updated", event: DB.format(req.event) });
        else res.status(400).send({ error: "Event not found" });
      } catch (error) {
        logger.error(
          `Internal server error at ${req.method} ${req.originalUrl}`,
          error
        );
        res.status(500).send({ error: "Internal server error" });
      }
    }
  )
  .delete(decodeToken, verifyToken, loadEvent, async (req: any, res) => {
    const logger: Logger | Console = (req as any).logger || console;
    try {
      if (String(req.event.creatorId) !== req.user.id) {
        res
          .status(400)
          .send({ error: "Events can only be deleted by their creator" });
        return;
      }

      await req.event.delete();

      await DB.Subscription.deleteMany({ eventId: req.event.id }).exec();

      if (req.event) res.status(200).send({ message: "Event deleted" });
      else res.status(400).send({ error: "Event not found" });
    } catch (error) {
      logger.error(
        `Internal server error at ${req.method} ${req.originalUrl}`,
        error
      );
      res.status(500).send({ error: "Internal server error" });
    }
  });

// SUBSCRIPTIONS
eventsApp.route("/:eventId(\\w+)/subscribe").post(
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
          .send({ error: "You can't subscribe to your own events" });
        return;
      }

      const subscriptions = await DB.Subscription.find({
        subscriberId: req.user.id,
      });

      const oldSubscription = subscriptions.find(
        (sub) => String(sub.eventId) === req.event.id
      );

      if (oldSubscription) {
        res.status(400).send({
          error: "You already have subscribed to this event",
          subscription: DB.format(oldSubscription),
        });
      } else if (subscriptions.length >= 3) {
        res.status(400).send({
          error: "Subscribed events limit exceeded",
        });
      } else {
        const subscription = await new DB.Subscription({
          eventId: req.event.id,
          subscriberId: req.user.id,
          subscriptionDate: Date.now(),
          comment: params.comment,
        }).save();

        res.status(200).send({
          message: "Subscribed successfully",
          subscription: DB.format(subscription),
        });
      }
    } catch (error) {
      logger.error(
        `Internal server error at ${req.method} ${req.originalUrl}`,
        error
      );
      res.status(500).send({ error: "Internal server error" });
    }
  }
);

export default eventsApp;
