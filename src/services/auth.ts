import {RequestHandler} from 'express';
import jwt from 'jsonwebtoken';
import * as DB from './db';

import config from '../config';
import { getMinuteInterval } from './utils';

export const decodeToken : RequestHandler = async (req, res, next) => {
  try {
    const bearerHeader = req.get('Authorization');
    const match = /^[Bb]earer (.+)$/.exec(bearerHeader);

    if (!match) {
      // No Bearer token found. No decoding necessary
      next();
    } else {
      // eslint-disable-next-line prefer-destructuring
      req.token = match[1];

      let decoded;
      try {
        decoded = jwt.verify(match[1], config.jwt.TOKEN_SECRET);
      } catch (error) {
        console.error(error);
        res.status(403).send({ error: 'Invalid session token' });
        return;
      }

      try {
        req.user = await DB.User.findById(decoded.id);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal server error' });
        return;
      }

      if (!req.user || req.user.sessionToken !== req.token)
        res.status(403).send({ error: 'Session token expired' });
      else next();
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Internal server error' });
  }
}

export const verifyToken : RequestHandler = async (req, res, next) => {
  if (!req.user) res.status(401).send({ error: 'Unauthorized' });
  else next();
}

export const checkBreeToken : RequestHandler = async (req, res, next) => {
  try {
    const bearerHeader = req.get('Authorization');
    const match = /^[Bb]earer (.+)$/.exec(bearerHeader);

    if (!match) {
      res.status(404).send({ error: 'Endpoint not found' });
    } else {
      // eslint-disable-next-line prefer-destructuring
      req.token = match[1];

      try {
        req.dates = jwt.verify(match[1], config.bree.BREE_SECRET);
      } catch (error) {
        console.error(error);
        res.status(403).send({ error: 'Invalid session token' });
        return;
      }

      if (!req.dates || !req.dates.start || !req.dates.end)
        res.status(403).send({ error: 'Invalid session token' });
      else next();
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Internal server error' });
  }
}

export function createBreeToken() {
  const { start, end, now } = getMinuteInterval();
  return jwt.sign({ start, end, now }, config.bree.BREE_SECRET, {
    expiresIn: config.bree.BREE_EXPIRATION,
  });
}

export function createToken(user) {
  return jwt.sign({ id: String(user.id) }, config.jwt.TOKEN_SECRET, {
    expiresIn: config.jwt.TOKEN_EXPIRATION,
  });
}

