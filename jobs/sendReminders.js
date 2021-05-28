const fs = require('fs');

const DB = require('../src/utils/db')();
const { sendReminders } = require('../src/socket');

// const sleep = (millis) => new Promise((resolve) => setTimeout(resolve, millis));

async function send() {
  const file = fs.createWriteStream(`./logs/${new Date().toISOString()}.txt`);
  try {
    process.stdout = file;
    process.stderr = file;
    console.info('sendReminders start at ', new Date().toISOString());
    const eventIds = JSON.parse(process.argv[2]);
    const events = await DB.Event.find().in('_id', eventIds).exec();
    await sendReminders(events);
    /*  
    console.info('sendReminders waiting at ', new Date().toISOString());
    await sleep(60000);
    */

    console.info('sendReminders end at ', new Date().toISOString());
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    file.close();
  }
}

send();

console.info('process.argv', process.argv);
