import SlackHook from "winston-slack-webhook-transport";
import { Format, FormatWrap, TransformableInfo } from "logform";
import { format } from "winston";

type Block = {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
};

export const extractAxios: FormatWrap = format((info) => {
  if (info.meta.isAxiosError && info.meta.response) {
    info.axios = {
      status: info.meta.response.status,
      data: info.meta.response.data,
    };
    info.meta = {};
  } else if (info.meta.isAxiosError) {
    info.axios = info.meta.toJSON();
    info.meta = {};
  } else if (info.meta.status && info.meta.headers) {
    info.axios = {
      status: info.meta.status,
      data: info.meta.data,
    };
    info.meta = {};
  }
  return info;
});

export const fileAndConsoleFormatter: Format = format.printf(
  ({ level, message, timestamp, stack, meta, axios }) => {
    let msg = message;

    //Add stack trace
    if (stack) msg += "\n" + stack + "\n";

    // Add axios metadata
    if (axios) msg += "\n" + JSON.stringify(axios, null, 2) + "\n";
    // Add other info
    if (meta && Object.keys(meta).length > 0)
      try {
        msg += "\n" + JSON.stringify(meta, null, 2) + "\n";
      } catch (error) {
        msg += "\n(meta is not stringify-able)\n";
      }

    //Add label
    return `[${timestamp} ${level}]: ${msg}`;
  }
);

const getHeaderBlock = (text: string): Block => ({
  type: "header",
  text: {
    type: "plain_text",
    text,
    emoji: true,
  },
});

const getMarkdownBlock = (text: string | Record<string, unknown>): Block => ({
  type: "section",
  text: {
    type: "mrkdwn",
    text:
      typeof text === "object"
        ? "```" + JSON.stringify(text, null, 2) + "```"
        : text,
  },
});

function getLevelEmoji(level: string): string {
  switch (level) {
    case "error":
      return ":red_circle:";
    case "warn":
      return ":large_yellow_circle:";
    case "info":
      return ":large_blue_circle:";
    default:
      return ":white_circle:";
  }
}

export function slackFormatter(
  service: string,
  filterPriorityOut: boolean,
  { level, message, stack, meta, axios }: TransformableInfo
): SlackHook.SlackMessage | false {
  if (level === "error" && filterPriorityOut) return false;

  const blocks: Block[] = [];

  const baseMessage = `${getLevelEmoji(level)} [${service}]: ${message}`;
  blocks.push(getHeaderBlock(baseMessage));

  if (stack || axios || (meta && Object.keys(meta).length > 0)) {
    blocks.push({ type: "divider" });

    if (stack) blocks.push(getMarkdownBlock(stack));
    if (axios) blocks.push(getMarkdownBlock(axios));
    if (meta && Object.keys(meta).length > 0)
      blocks.push(getMarkdownBlock(meta));
  }
  return {
    text: baseMessage,
    blocks,
  };
}
