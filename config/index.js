module.exports = {
  api: {
    DOMAIN: process.env.API_DOMAIN || 'localhost',
    PORT: process.env.API_PORT || '3000',
  },
  db: {
    DOMAIN: process.env.DB_DOMAIN || process.env.API_DOMAIN || 'localhost',
    PORT: process.env.DB_PORT || '27017',
    DB_NAME: process.env.DB_NAME || 'WhisbiEventManager',
  },
  socket: {
    DOMAIN: process.env.SOCKET_DOMAIN || process.env.API_DOMAIN || 'localhost',
    PORT: process.env.SOCKET_PORT || '27017',
  },
  jwt: {
    TOKEN_SECRET: process.env.TOKEN_SECRET,
  },
};
