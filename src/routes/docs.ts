import express from "express";
import swaggerUi from "swagger-ui-express";

import docs from "@/docs/event-manager-api.openapi.json";
import { delayAfterResponse } from "@/services/middlewares";
import { closeLogger, getLoggerMiddleware } from "@/services/winston";

const app = express();

app.use(getLoggerMiddleware("routes/docs"));
app.use(delayAfterResponse(closeLogger));

app.use("/", swaggerUi.serveFiles(docs, {}), swaggerUi.setup(docs));

export default app;
