module.exports = () => {
  process.env.WINSTON_CONSOLE_LEVEL = 'none';
  process.env.WINSTON_SLACK_LEVEL = 'none';

  process.env.WINSTON_FILE_LEVEL = 'info';
  process.env.WINSTON_FILE_PREFIX = '_jest_';

  process.env.DISABLE_MOCKED_WARNING = true;
};
