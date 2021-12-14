const { default: Axios } = require('axios');

const config = require('@/config');

const setAuth = ({ token, user, pass } = {}) => {
  if (token) return { headers: { Authorization: `Bearer ${token}` } };
  if (user && pass) return { auth: { username: user, password: pass } };
  return {};
};

const errorHandler = (error) => {
  if (error.response) {
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
      `http://localhost:${config.api.PORT}/${path}`,
      setAuth(auth)
    ).catch(errorHandler);

  const post = (path, body, auth = currentAuth) =>
    Axios.post(
      `http://localhost:${config.api.PORT}/${path}`,
      body,
      setAuth(auth)
    ).catch(errorHandler);

  const put = (path, body, auth = currentAuth) =>
    Axios.put(
      `http://localhost:${config.api.PORT}/${path}`,
      body,
      setAuth(auth)
    ).catch(errorHandler);

  const destroy = (path, auth = currentAuth) =>
    Axios.delete(
      `http://localhost:${config.api.PORT}/${path}`,
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

  const Dev = {
    ping: () => post('dev/ping'),
    remind: () => post('dev/remind'),
    remindAll: () => post('dev/remind-all'),
    remindAllBree: () => post('dev/remind-all-bree'),
    remindBree: () => post('dev/remind-bree'),
  };

  const Jobs = {
    remind: (token) => post('jobs/remind', null, { token }),
  };

  return {
    Events,
    Users,
    setToken: (token) => {
      currentAuth = { token };
    },
    Dev,
    Jobs,
  };
};
