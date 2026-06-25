process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "test-refresh-secret";

const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const { permissionGuard } = require("../src/middleware/permissionGuard.js");
const { generateAccessToken } = require("../src/utils/jwt.js");

function createApp() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith("Bearer ")) {
      try {
        req.user = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
      } catch {
        // ignore invalid tokens
      }
    }
    next();
  });

  app.get(
    "/check/:perm",
    (req, res, next) => {
      permissionGuard(req.params.perm)(req, res, next);
    },
    (req, res) => {
      res.status(200).json({ ok: true });
    },
  );

  return app;
}

describe("Permission middleware integration", () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  describe("SUPER_ADMIN", () => {
    const token = generateAccessToken({
      id: "u1",
      role: "SUPER_ADMIN",
    });

    test("allows a representative permission", async () => {
      const res = await request(app)
        .get("/check/employee.read")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    test("denies when no bearer token", async () => {
      const res = await request(app).get("/check/employee.read");
      expect(res.status).toBe(401);
    });
  });

  describe("HR_ADMIN", () => {
    const token = generateAccessToken({
      id: "u2",
      role: "HR_ADMIN",
    });

    test("uses scoped permission matrix for unknown permissions", async () => {
      const res = await request(app)
        .get("/check/system.global_settings")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(403);
    });
  });

  describe("EMPLOYEE", () => {
    const token = generateAccessToken({
      id: "u3",
      role: "EMPLOYEE",
    });

    test("allows attendance.checkin", async () => {
      const res = await request(app)
        .get("/check/attendance.checkin")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    test("denies user.create (resource user is not granted)", async () => {
      const res = await request(app)
        .get("/check/user.create")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(403);
    });
  });

  describe("MANAGER", () => {
    const token = generateAccessToken({
      id: "u4",
      role: "MANAGER",
    });

    test("allows attendance.view_team", async () => {
      const res = await request(app)
        .get("/check/attendance.view_team")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    test("denies user.create", async () => {
      const res = await request(app)
        .get("/check/user.create")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(403);
    });
  });
});
