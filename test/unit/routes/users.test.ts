import request from "supertest";
import crypto from "crypto";
import { mocked } from "ts-jest/utils";

import app from "@/app";
import { closeConnection, createConnection, User } from "@/services/db";
import { decodeToken, hash } from "@/services/auth";
import { USER_RPM, USER_SIZE } from "@/routes/users";

import { clearDatabase } from "test/mocks/db";

jest.mock("@/services/auth", () => {
  const module =
    jest.requireActual<typeof import("@/services/auth")>("@/services/auth");

  return {
    ...module,

    decodeToken: jest.fn(),
    verifyToken: jest.fn((req, res, next) => next()),
    createToken: jest.fn(() => "token"),
  };
});

const mockedDecodeToken = mocked(decodeToken, true);

describe("The /users API", () => {
  beforeAll(createConnection);

  beforeEach(jest.clearAllMocks);

  afterEach(clearDatabase);

  afterAll(closeConnection);

  describe("POST /users/sign-up endpoint", () => {
    it("Returns 400 on empty body", async () => {
      // given
      const body = {};

      // when
      const response = await request(app).post("/users/sign-up").send(body);

      // then
      expect(response.status).toEqual(400);
      expect(response.body).toBeDefined();
      expect(response.body.message).toMatch(/is required/);
    });

    it("Returns 400 if the provided email is invalid", async () => {
      // given
      const body = {
        name: "John Doe",
        email: "notAValidEmail",
        password: "password",
      };

      // when
      const response = await request(app).post("/users/sign-up").send(body);

      // then
      expect(response.status).toEqual(400);
      expect(response.body).toBeDefined();
      expect(response.body.message).toMatch(/email.*must be a valid email/);
    });

    it("Returns 400 if the email is already in use", async () => {
      // given
      const body = {
        name: "John Doe",
        email: "john@doe.com",
        password: "password",
      };
      await new User({
        name: "John Doe",
        email: "john@doe.com",
        hashedPassword: hash("password"),
      }).save();

      // when
      const response = await request(app).post("/users/sign-up").send(body);

      // then
      expect(response.status).toEqual(400);
      expect(response.body).toBeDefined();
      expect(response.body.message).toEqual("Email already in use");
    });

    it("Returns 200 and a token on success", async () => {
      // given
      const body = {
        name: "John Doe",
        email: "john@doe.com",
        password: "password",
      };

      // when
      const response = await request(app).post("/users/sign-up").send(body);

      // then
      expect(response.status).toEqual(200);
      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty("token");
      expect(response.body.message).toEqual("Signed up successfully");
    });
  });

  describe("POST /users/sign-in endpoint", () => {
    beforeEach(async () => {
      const user = await new User({
        name: "John Doe",
        email: "john@doe.com",
        hashedPassword: hash("password"),
      }).save();

      mockedDecodeToken.mockImplementation((req: any, res, next) => {
        req.token = "token";
        req.user = user;
        next();
      });
    });

    it("Returns 400 if no auth is provided", async () => {
      // given

      // when
      const response = await request(app).post("/users/sign-in").send();

      // then
      expect(response.status).toEqual(400);
      expect(response.body).toBeDefined();
      expect(response.body.message).toEqual(
        "Credentials must be provided as Basic Auth (email:password)"
      );
    });

    it("Returns 400 if auth is empty", async () => {
      // given
      const email = undefined;
      const password = undefined;

      // when
      const response = await request(app)
        .post("/users/sign-in")
        .auth(email, password)
        .send();

      // then
      expect(response.status).toEqual(400);
      expect(response.body).toBeDefined();
      expect(response.body.message).toEqual(
        expect.stringContaining("must be a valid email")
      );
    });

    it("Returns 200 and a token on success", async () => {
      // given
      const email = "john@doe.com";
      const password = "password";

      // when
      const response = await request(app)
        .post("/users/sign-in")
        .auth(email, password)
        .send();

      // then
      expect(response.status).toEqual(200);
      expect(response.body).toBeDefined();
      expect(response.body.message).toEqual("Signed in successfully");
      expect(response.body).toHaveProperty("token");
    });
  });

  describe("POST /users/sign-out endpoint", () => {
    beforeEach(async () => {
      const user = await new User({
        name: "John Doe",
        email: "john@doe.com",
        hashedPassword: hash("password"),
      }).save();

      mockedDecodeToken.mockImplementation((req: any, res, next) => {
        req.token = "token";
        req.user = user;
        next();
      });
    });

    it("Returns 200 on success", async () => {
      // given

      // when
      const response = await request(app).post("/users/sign-out").send();

      // then
      expect(response.status).toEqual(200);
      expect(response.body).toBeDefined();
      expect(response.body.message).toEqual("Signed out successfully");
    });
  });

  describe("Denial of service", () => {
    it(`Returns 413 if the payload is greater than ${USER_SIZE}`, async () => {
      // given
      const createRandomString = (length: number): string =>
        crypto.randomBytes(length).toString("hex");

      const body = {
        email: "fail@example.com",
        password: "password",
        name: createRandomString(5000),
      };

      // when
      const response = await request(app).post("/users/sign-up").send(body);

      // then
      expect(response.status).toEqual(413);
      expect(response.body).toBeDefined();
      expect(response.body.message).toEqual("Payload too large");
    });

    it(`Returns 429 after ${USER_RPM} requests in a minute`, async () => {
      // given
      const generateBody = (i: number) => ({
        name: `John Doe ${i}`,
        email: `john-${i}@doe.com`,
        password: "password",
      });

      // when
      const requestPromises = new Array(USER_RPM + 1)
        .fill(undefined)
        .map((_, i) =>
          request(app).post("/users/sign-up").send(generateBody(i))
        );
      const responses = await Promise.all(requestPromises);

      // then
      const validResponses = responses.filter(
        (response) => response.status === 200
      );
      const rejectedResponses = responses.filter(
        (response) => response.status === 429
      );

      expect(validResponses.length).toBeLessThanOrEqual(USER_RPM);
      expect(rejectedResponses.length).toBeGreaterThanOrEqual(1);
    });
  });
});
