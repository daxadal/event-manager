const { default: Axios } = require('axios');

const config = require('../../config');

const setAuth = ({ token, user, pass } = {}) => {
  if (token) return { headers: { Authorization: `Bearer ${token}` } };
  if (user && pass) return { auth: { username: user, password: pass } };
  return {};
};

const errorHandler = (error) => {
  if (error.response) {
    // console.error('Response error: ', error.response.data);
    return error.response;
  }

  if (error.request) console.error('Petition error: ', error.request);
  else console.error('Unexpected Error', error.message);

  throw error;
};

module.exports = () => {
  let currentAuth;

  const get = (path, auth = currentAuth) =>
    Axios.get(
      `${config.api.DOMAIN}:${config.api.PORT}/${path}`,
      setAuth(auth)
    ).catch(errorHandler);

  const post = (path, body, auth = currentAuth) =>
    Axios.post(
      `${config.api.DOMAIN}:${config.api.PORT}/${path}`,
      body,
      setAuth(auth)
    ).catch(errorHandler);

  const put = (path, body, auth = currentAuth) =>
    Axios.put(
      `${config.api.DOMAIN}:${config.api.PORT}/${path}`,
      body,
      setAuth(auth)
    ).catch(errorHandler);

  const destroy = (path, auth = currentAuth) =>
    Axios.delete(
      `${config.api.DOMAIN}:${config.api.PORT}/${path}`,
      setAuth(auth)
    ).catch(errorHandler);

  const Events = {
    getAll: () => get('events'),
    get: (eventId) => get(`events/${eventId}`),
    create: (body) => post('events', body),
    update: (eventId, body) => put(`events/${eventId}`, body),
    destroy: (eventId) => destroy(`events/${eventId}`),
    subscribe: (eventId, body) => post(`events/${eventId}/subscribe`, body),
  };

  const Users = {
    signup: (body) => post('users/sign-up', body),
    signin: (email, pass) => post('users/sign-in', null, { user: email, pass }),
    signout: () => post('users/sign-out'),
  };

  return {
    Events,
    Users,
    setToken: (token) => {
      currentAuth = { token };
    },
    ping: () => post('ping'),
    remind: (body) => post('remind', body),
    remindAll: (body) => post('remind-all', body),
    remindAllBree: () => post('remind-all-bree'),
    remindBree: () => post('remind-bree'),
  };
};
