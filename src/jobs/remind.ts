import { sendReminders } from "@/socket";
import { Event } from "@/services/db";
import { getLogger } from "@/services/winston";

export const MINUTES_AHEAD = 1440;

const logger = getLogger("cron");

export function getMinuteInterval() {
  const start = new Date();
  start.setSeconds(0, 0);
  start.setMinutes(start.getMinutes() + MINUTES_AHEAD);

  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 1);
  return { start, end };
}

export async function remindEvents() {
  logger.info("Start remind events");
  const { start, end } = getMinuteInterval();

  const events = await Event.find({
    startDate: { $gte: start, $lte: end },
  });
  logger.info(`Send reminders for ${events.length} events`);
  await sendReminders(events);
  logger.info("Remind events - Reminders sent");
}
export async function remindAllEvents() {
  logger.info("Start remind all events");
  const events = await Event.find();
  logger.info(`Send reminders for ${events.length} events`);
  await sendReminders(events);
  logger.info("Remind events - Reminders sent");
}
