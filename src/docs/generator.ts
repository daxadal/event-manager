/* global __dirname */
import swaggerJsdoc, { OAS3Options } from "swagger-jsdoc";
import fs from "fs";
import path from "path";

async function generateDocsForVersion(
  options: OAS3Options,
  fileName: string,
  apiName: string
) {
  console.info(`Generating docs for ${apiName}...`);

  const openApiSpecification = swaggerJsdoc(options);

  fs.writeFileSync(
    path.join(__dirname, `${fileName}.openapi.json`),
    JSON.stringify(openApiSpecification, null, 2)
  );

  console.info(`Docs generated for ${apiName}`);
  console.info(`---------------------------`);

  return openApiSpecification;
}

export async function generate(): Promise<object> {
  const servers = [{ url: "http://localhost:3000", description: "Local API" }];

  const options: OAS3Options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Event Manager API",
        description: "Documentation for Event Manager API",
        contact: { email: "e.garciadececa@gmail.com" },
        version: "1.0.0",
      },
      servers,
    },
    apis: ["./src/docs/*.yml", "./src/routes/**/*.js", "./src/routes/**/*.ts"],
  };

  return generateDocsForVersion(options, "event-manager-api", "Event Manager API");
}

generate();
