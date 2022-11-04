import type { RequestHandler } from "express";

export function delayAfterResponse(middleware: RequestHandler): RequestHandler {
  return function (req, res, next) {
    const end = res.end;
    res.end = function (...args: Parameters<typeof end>) {
      res.end = end;
      res.end(...args);

      middleware(req, res, () => null);
    } as typeof end;

    next();
  };
}
