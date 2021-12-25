import { NextFunction, Request, RequestHandler, Response } from "express";
import Joi, { LanguageMessages } from "joi";
import { Logger } from "winston";

export const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const validate =
  (fieldToValidate: "body" | "query" | "params") =>
  (schema: Joi.Schema, messages?: LanguageMessages): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    const logger: Logger | Console = (req as any).logger || console;
    const { value, error } = schema.validate(req[fieldToValidate], {
      messages,
    });
    if (error) {
      logger.info(
        `"${req.originalUrl}": ${fieldToValidate} failed validation:\n -  Error: ${error.message}`
      );
      logger.debug(`Full Joi error:`, error);
      res.status(400).send({ error: error.message });
    } else {
      req[fieldToValidate] = value;
      next();
    }
  };

export const validateBody = validate("body");
export const validateQuery = validate("query");
export const validatePath = validate("params");
