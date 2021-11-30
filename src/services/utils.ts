import config from '../config';

export function getMinuteInterval(now = new Date()) {
  const start = new Date(now);
  start.setSeconds(0, 0);
  start.setMinutes(start.getMinutes() + config.bree.MINUTES_AHEAD);

  const end = new Date(now);
  end.setSeconds(0, 0);
  end.setMinutes(end.getMinutes() + config.bree.MINUTES_AHEAD + 1);
  return { start, end, now };
}
