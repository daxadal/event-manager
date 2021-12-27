import express from "express";
import swaggerUi from "swagger-ui-express";

import docs from "@/docs/event-manager-api.openapi.json";

const app = express();
app.use("/", swaggerUi.serveFiles(docs, {}), swaggerUi.setup(docs));

export default app;
