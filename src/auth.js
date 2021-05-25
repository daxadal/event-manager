const jwt = require('jsonwebtoken');

module.exports = (DB) => {
  async function verifyToken(req, res, next) {
    try {
      const bearerHeader = req.get('Authorization');
      const match = /^[Bb]earer (.+)$/.exec(bearerHeader);
      console.info('Bearer match: ', match);
      if (match) {
        // eslint-disable-next-line prefer-destructuring
        req.token = match[1];
        try {
          const decoded = jwt.verify(match[1], process.env.TOKEN_SECRET);
          console.info('Token', match[1], 'decoded', decoded);

          req.user = await DB.User.findById(decoded.id);
          if (req.user) {
            console.info('Token verified. User:', decoded, req.user);
            next();
          } else res.status(403).send({ error: 'Invalid session token' });
        } catch (error) {
          console.error(error);
          res.status(403).send({ error: 'Invalid session token' });
        }
      } else {
        res.status(401).send({ error: 'Unauthorized' });
      }
    } catch (error) {
      console.error(error);
      res.status(400).send({ error });
    }
  }

  function createToken(user) {
    // eslint-disable-next-line no-underscore-dangle
    return jwt.sign({ id: String(user._id) }, process.env.TOKEN_SECRET, {
      expiresIn: '1800s',
    });
  }
  return { createToken, verifyToken };
};
