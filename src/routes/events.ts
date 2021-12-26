import { json, RequestHandler, Router, urlencoded } from "express";
import rateLimit from "express-rate-limit";
import Joi from "joi";
import { Logger } from "winston";

import {
  Event,
  EventDocument,
  EventState,
  format,
  Subscription,
  UserDocument,
} from "@/services/db";
import { verifyToken, decodeToken } from "@/services/auth";
import {
  OBJECT_ID_REGEX,
  validateBody,
  validatePath,
} from "@/services/validations";

export const EVENT_SIZE = "1kb";
export const EVENT_RPM = 100;

export const MAX_SUBSCRIPTIONS = 3;

// EVENTS
const router = Router();

router.use(json({ limit: EVENT_SIZE }));
router.use(urlencoded({ extended: true }));
router.use(
  rateLimit({
    max: EVENT_RPM,
    windowMs: 60 * 1000, // 1 minute
    message: "Too many requests",
  })
);

function isVisible(event: EventDocument, user: UserDocument) {
  switch (event.state) {
    case EventState.PUBLIC:
      return true;
    case EventState.PRIVATE:
      return Boolean(user);
    case EventState.DRAFT:
      return Boolean(user) && user.id === String(event.creatorId);
    default:
      throw new Error("Event has an unexpected state");
  }
}

const loadEvent: RequestHandler = async (req: any, res, next) => {
  const logger: Logger | Console = (req as any).logger || console;
  const { eventId } = req.params;
  try {
    req.event = await Event.findById(eventId).exec();

    if (req.event && isVisible(req.event, req.user)) next();
    else res.status(400).send({ message: "Event not found" });
  } catch (error) {
    logger.error(
      `Internal server error at ${req.method} ${req.originalUrl}`,
      error
    );
    res.status(500).send({ message: "Internal server error" });
  }
};

router
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
        state: Joi.valid(...Object.values(EventState)).default(EventState.DRAFT),
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

router
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
      res.status(200).send({ event: format(req.event) });
    } catch (error) {
      logger.error(
        `Internal server error at ${req.method} ${req.originalUrl}`,
        error
      );
      res.status(500).send({ message: "Internal server error" });
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

        if (req.event.state !== EventState.PUBLIC && newEvent.state === EventState.PUBLIC) {
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

// SUBSCRIPTIONS
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
