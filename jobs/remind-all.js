const API = require('../src/utils/api')();

async function callAPI() {
  try {
    console.info('Calling API...');
    await API.Dev.remindAll();
    console.info('API returned successfully');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

callAPI();
