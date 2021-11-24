const { createBreeToken } = require('../services/auth');

const API = require('../services/api')();

async function callAPI() {
  try {
    console.info('Calling API...');
    await API.Jobs.remind(createBreeToken());
    console.info('API returned successfully');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

callAPI();
