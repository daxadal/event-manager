import { sendReminders } from "../socket";
import { Event } from "@/services/db";

export const MINUTES_AHEAD = 1440;

export function getMinuteInterval(now = new Date()) {
  const start = new Date(now);
  start.setSeconds(0, 0);
  start.setMinutes(start.getMinutes() + MINUTES_AHEAD);

  const end = new Date(now);
  end.setSeconds(0, 0);
  end.setMinutes(end.getMinutes() + MINUTES_AHEAD + 1);
  return { start, end, now };
}

export async function remindEvents() {
  const { start, end } = getMinuteInterval();

  const events = await Event.find({
    startDate: { $gte: start, $lte: end },
  });
  sendReminders(events);
}
export async function remindAllEvents() {
  const events = await Event.find();
  sendReminders(events);
}
