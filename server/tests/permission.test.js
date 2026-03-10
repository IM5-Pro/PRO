const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const permissionGuard = require("../src/middleware/permissionGuard.js").default;
const { roles, permissionsList } = require("../roleSeeder.js");
const { generateAccessToken } = require("../src/utils/jwt.js");

// small helper application that exercises the permission middleware
function createApp() {
  const app = express();
  app.use(express.json());
  // simple "authentication" middleware that reads a bearer token
  // and attaches the decoded user payload to req.user.
  app.use((req, res, next) => {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith("Bearer ")) {
      try {
        req.user = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
      } catch (err) {
        // ignore invalid tokens
      }
    }
    next();
  });

  app.get(
    "/check/:perm",
    (req, res, next) => {
      // middleware factory returns a handler
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
    // make sure the signing secret is defined for generateAccessToken
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
    app = createApp();
  });

  // iterate roles and assert the assigned perms are allowed and a few others are denied
  roles.forEach((role) => {
    describe(role.name, () => {
      const token = generateAccessToken({
        id: "dummy",
        role: role.name,
        permissions: role.permissions,
      });

      role.permissions.forEach((perm) => {
        test(`allows permission ${perm}`, async () => {
          const res = await request(app)
            .get(`/check/${perm}`)
            .set("Authorization", `Bearer ${token}`);
          expect(res.status).toBe(200);
        });
      });

      const notPerms = permissionsList.filter(
        (p) => !role.permissions.includes(p),
      );
      // pick first few not-owned permissions to ensure negative behaviour
      notPerms.slice(0, 5).forEach((perm) => {
        test(`denies permission ${perm}`, async () => {
          const res = await request(app)
            .get(`/check/${perm}`)
            .set("Authorization", `Bearer ${token}`);
          expect(res.status).toBe(403);
        });
      });
    });
  });
});
