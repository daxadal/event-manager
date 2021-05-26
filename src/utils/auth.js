const jwt = require('jsonwebtoken');
const DB = require('./db')();

const config = require('../../config');

async function decodeToken(req, res, next) {
  try {
    const bearerHeader = req.get('Authorization');
    const match = /^[Bb]earer (.+)$/.exec(bearerHeader);

    if (match) {
      // eslint-disable-next-line prefer-destructuring
      req.token = match[1];
      try {
        const decoded = jwt.verify(match[1], config.jwt.TOKEN_SECRET);

        req.user = await DB.User.findById(decoded.id);
        if (req.user) {
          next();
        } else res.status(403).send({ error: 'Invalid session token' });
      } catch (error) {
        console.error(error);
        res.status(403).send({ error: 'Invalid session token' });
      }
    } else {
      next();
    }
  } catch (error) {
    console.error(error);
    res.status(400).send({ error });
  }
}

async function verifyToken(req, res, next) {
  if (!req.user) res.status(401).send({ error: 'Unauthorized' });
  else next();
}

function createToken(user) {
  return jwt.sign({ id: String(user.id) }, config.jwt.TOKEN_SECRET, {
    expiresIn: '1800s',
  });
}
module.exports = { createToken, decodeToken, verifyToken };
