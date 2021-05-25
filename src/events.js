const express = require('express');
const Joi = require('joi');

const DB = require('./utils/db')();
const { verifyToken } = require('./utils/auth');

// EVENTS
const eventsApp = express.Router();

eventsApp.use(express.json());
eventsApp.use(express.urlencoded({ extended: true }));

eventsApp
  .route('/')
  .post(verifyToken, async (req, res) => {
    try {
      const inputSchema = Joi.object({
        headline: Joi.string().min(10).max(100).required(),
        description: Joi.string().max(500),
        startDate: Joi.date().required(),
        location: Joi.string().min(10).max(100).required(),
        state: Joi.valid('draft', 'public', 'private').default('draft'),
      });

      const event = await inputSchema.validateAsync(req.body).catch((error) => {
        throw error.message;
      });

      console.log('Event:', event);

      const eventDB = await new DB.Event({
        ...event,
        creatorId: req.user.id,
      }).save();

      res.status(200).send(eventDB);
    } catch (error) {
      console.error(error);
      res.status(400).send({ error });
    }
  })
  .get(async (req, res) => {
    try {
      const events = await DB.Event.find().exec();

      console.info('Events retieved:', events);
      if (events) res.status(200).send(events);
      else res.status(400).send({ error: 'Event not found' });
    } catch (error) {
      console.error(error);
      res.status(400).send({ error });
    }
  });

eventsApp
  .route('/:eventId(\\w+)')
  .get(async (req, res) => {
    try {
      const { eventId } = req.params;

      console.log('Params:', req.params);

      const event = await DB.Event.findById(eventId).exec();

      console.info('Event retieved:', event);
      if (event) res.status(200).send(event);
      else res.status(400).send({ error: 'Event not found' });
    } catch (error) {
      console.error(error);
      res.status(400).send({ error });
    }
  })
  .put(verifyToken, async (req, res) => {
    try {
      const { eventId } = req.params;

      const inputSchema = Joi.object({
        headline: Joi.string().min(10).max(100).required(),
        description: Joi.string().max(500),
        startDate: Joi.date().required(),
        location: Joi.string().min(10).max(100).required(),
        state: Joi.valid('draft', 'public', 'private').default('draft'),
      });

      const newEvent = await inputSchema
        .validateAsync(req.body)
        .catch((error) => {
          throw error.message;
        });

      let event = await DB.Event.findById(eventId).exec();

      if (!event) {
        res.status(400).send({ error: 'Event not found' });
        return;
      }

      if (String(event.creatorId) !== req.user.id) {
        res
          .status(400)
          .send({ error: 'Events can only be edited by their creator' });
        return;
      }

      event.headline = newEvent.headline;
      event.description = newEvent.description;
      event.startDate = newEvent.startDate;
      event.location = newEvent.location;
      event.state = newEvent.state;

      event = await event.save();

      console.log('Event updated:', event);

      console.info(event);
      if (event) res.status(200).send(event);
      else res.status(400).send({ error: 'Event not found' });
    } catch (error) {
      console.error(error);
      res.status(400).send({ error });
    }
  })
  .delete(verifyToken, async (req, res) => {
    try {
      const { eventId } = req.params;

      console.log('Params:', req.params);

      const event = await DB.Event.findById(eventId).exec();

      if (!event) {
        res.status(400).send({ error: 'Event not found' });
        return;
      }
      if (String(event.creatorId) !== req.user.id) {
        res
          .status(400)
          .send({ error: 'Events can only be edited by their creator' });
        return;
      }

      await event.delete();

      if (event) res.status(200).send(event);
      else res.status(400).send({ error: 'Event not found' });
    } catch (error) {
      console.error(error);
      res.status(400).send({ error });
    }
  });

// SUBSCRIPTIONS
eventsApp
  .route('/:eventId(\\w+)/subscribe')
  .post(verifyToken, async (req, res) => {
    try {
      const { eventId } = req.params;

      const inputSchema = Joi.object({
        comment: Joi.string(),
      }).optional();

      const params = await inputSchema
        .validateAsync(req.body)
        .catch((error) => {
          throw error.message;
        });

      const event = await DB.Event.findById(eventId);
      console.info('Event:', event);

      if (!event) {
        res.status(400).send({ error: 'Event not found' });
        return;
      }

      if (String(event.creatorId) === req.user.id) {
        res
          .status(400)
          .send({ error: "You can't subscribe to your own events" });
        return;
      }

      const oldSubscription = await DB.Subscription.findOne({
        eventId: event.id,
        subscriberId: req.user.id,
      });

      if (oldSubscription) {
        res.status(400).send({
          message: 'You already have subscribed to this event',
          subscription: oldSubscription,
        });
      } else {
        const subscription = await new DB.Subscription({
          eventId: event.id,
          subscriberId: req.user.id,
          comment: params.comment,
        }).save();

        res
          .status(200)
          .send({ message: 'Subscribed successfully', subscription });
      }
    } catch (error) {
      console.error(error);
      res.status(400).send({ error });
    }
  });

module.exports = eventsApp;
