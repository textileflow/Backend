const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const User = require("../src/models/Auth/auth");

let mongoServer;

beforeAll(async () => {
  process.env.JWT_SECRET = "test_jwt_secret_key_12345";
  process.env.JWT_EXPIRES_IN = "1d";
  process.env.NODE_ENV = "test";

  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await User.deleteMany({});
  if (User.Counter) {
    await User.Counter.deleteMany({});
  }
});

describe("Authentication API Tests (/api/auth)", () => {
  const sampleUser = {
    name: "John Doe",
    email: "john@example.com",
    password: "password123",
    role: "manager",
  };

  describe("POST /api/auth/register", () => {
    it("should register a user with data flattened directly into data property", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send(sampleUser);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("User registered successfully");
      expect(res.body.data).toHaveProperty("token");
      expect(res.body.data.id).toBe(1);
      expect(typeof res.body.data.id).toBe("number");
      expect(res.body.data).not.toHaveProperty("_id");
      expect(res.body.data).not.toHaveProperty("user");
      expect(res.body.data.email).toBe(sampleUser.email.toLowerCase());
      expect(res.body.data.role).toBe(sampleUser.role);
      expect(res.body.data).not.toHaveProperty("password");

      // Register second user
      const res2 = await request(app).post("/api/auth/register").send({
        name: "Jane Doe",
        email: "jane@example.com",
        password: "password123",
        role: "staff",
      });

      expect(res2.statusCode).toEqual(201);
      expect(res2.body.data.id).toBe(2);
      expect(typeof res2.body.data.id).toBe("number");
      expect(res2.body.data).not.toHaveProperty("_id");
      expect(res2.body.data).not.toHaveProperty("user");
    });

    it("should reject duplicate registration with the same email", async () => {
      await request(app).post("/api/auth/register").send(sampleUser);

      const res = await request(app)
        .post("/api/auth/register")
        .send(sampleUser);

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Email address is already registered/i);
    });

    it("should reject registration if required fields are missing", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "incomplete@example.com" });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty("errors");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/api/auth/register").send(sampleUser);
    });

    it("should successfully log in and return flattened data object", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: sampleUser.email,
        password: sampleUser.password,
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Login successful");
      expect(res.body.data).toHaveProperty("token");
      expect(res.body.data.id).toBe(1);
      expect(typeof res.body.data.id).toBe("number");
      expect(res.body.data).not.toHaveProperty("_id");
      expect(res.body.data).not.toHaveProperty("user");
      expect(res.body.data.email).toBe(sampleUser.email.toLowerCase());
    });

    it("should reject login with wrong password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: sampleUser.email,
        password: "wrongpassword",
      });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Invalid email or password");
    });

    it("should reject login with non-existent email", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "nonexistent@example.com",
        password: "password123",
      });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Invalid email or password");
    });

    it("should reject login if account isActive is false", async () => {
      await User.updateOne({ email: sampleUser.email }, { isActive: false });

      const res = await request(app).post("/api/auth/login").send({
        email: sampleUser.email,
        password: sampleUser.password,
      });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/deactivated/i);
    });
  });

  describe("GET /api/auth/profile & /api/auth/profile/:id", () => {
    let validToken;

    beforeEach(async () => {
      const regRes = await request(app)
        .post("/api/auth/register")
        .send(sampleUser);
      validToken = regRes.body.data.token;
    });

    it("should return 401 when accessing /profile without token", async () => {
      const res = await request(app).get("/api/auth/profile");

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/token required/i);
    });

    it("should return profile by ID when passing :id param in URL with valid token", async () => {
      const res = await request(app)
        .get("/api/auth/profile/1")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(1);
      expect(res.body.data.email).toBe(sampleUser.email.toLowerCase());
      expect(res.body.data.name).toBe(sampleUser.name);
    });

    it("should return 404 if requested user ID does not exist in database", async () => {
      const res = await request(app)
        .get("/api/auth/profile/999")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/user not found/i);
    });

    it("should return 401 when accessing /profile/:id with invalid token", async () => {
      const res = await request(app)
        .get("/api/auth/profile/1")
        .set("Authorization", "Bearer invalid_token_12345");

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid/i);
    });
  });

  describe("POST /api/auth/logout", () => {
    let validToken;

    beforeEach(async () => {
      const regRes = await request(app)
        .post("/api/auth/register")
        .send(sampleUser);
      validToken = regRes.body.data.token;
    });

    it("should return 401 Unauthorized when logging out without token", async () => {
      const res = await request(app).post("/api/auth/logout");

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/token required/i);
    });

    it("should return 200 OK on logout with valid token", async () => {
      const res = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Logged out successfully");
    });
  });
});
