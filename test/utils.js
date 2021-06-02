const API = require('../src/utils/api')();
/**
 * Generate a bunch of users for testing and returns an object containing
 * @param {String} common A common name for all the users. It's better if it's different each time you
 * want to create a batch of users.
 * @param {String[]} uniques An array of unique sufixes, one per user created.
 * @returns All the generated tokens, indexed by `uniques` values
 */
async function generateTokens(common, uniques) {
  const promises = uniques.map((unique) =>
    API.Users.signup({
      name: `${common}${unique}`,
      email: `${common}${unique}@example.com`,
      password: 'pass',
    })
  );
  const responses = await Promise.all(promises);

  const tokens = {};
  responses.forEach((response, i) => {
    const unique = uniques[i];
    tokens[unique] = response.data.token;
  });
  return tokens;
}

async function generateEvents({ length, startDate, state, token }) {
  API.setToken(token);
  const promises = [...Array(length).keys()].map((i) =>
    API.Events.create({
      headline: `New event ${i}`,
      startDate,
      location: { name: 'Somewhere' },
      state,
    })
  );
  const responses = await Promise.all(promises);
  return responses.map((response) => response.data.event);
}
module.exports = { generateTokens, generateEvents };
