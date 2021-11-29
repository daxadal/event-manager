const Graceful = require('@ladjs/graceful');
const Bree = require('bree');

const config = require('./config');

const bree = new Bree({
  jobs: [
    {
      name: 'remind-all',
      timeout: false,
    },
    {
      name: 'remind',
      interval: config.bree.INTERVAL,
    },
  ],
});

// handle graceful reloads, pm2 support, and events like SIGHUP, SIGINT, etc.
const graceful = new Graceful({ brees: [bree] });
graceful.listen();

export default bree;
