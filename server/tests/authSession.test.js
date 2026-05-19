process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "test-refresh-secret";

import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import authGuard from "../src/middleware/authGuard.js";
import { sendSuccess } from "../src/utils/response.js";
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  getAccessTokenFromRequest,
  getRefreshTokenFromRequest,
} from "../src/utils/sessionCookies.js";
const app = express();
app.use(cookieParser());
app.use(express.json());

app.get("/api/auth/me", authGuard, (req, res) =>
  sendSuccess(res, 200, "Session active", { data: { user: { id: req.user.id } } }),
);

app.post("/api/auth/refresh-token", (req, res) => {
  const token = getRefreshTokenFromRequest(req);
  if (!token) {
    return res.status(400).json({ message: "Refresh token is required" });
  }
  return res.status(401).json({ message: "Invalid refresh token" });
});

describe("HttpOnly auth session cookies", () => {
  test("/me rejects requests without session cookie", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  test("getRefreshTokenFromRequest reads cookie value", () => {
    const req = {
      cookies: { [REFRESH_COOKIE_NAME]: "refresh-value" },
      body: {},
    };
    expect(getRefreshTokenFromRequest(req)).toBe("refresh-value");
  });

  test("getAccessTokenFromRequest prefers HttpOnly cookie", () => {
    const req = {
      cookies: { [ACCESS_COOKIE_NAME]: "access-from-cookie" },
      headers: { authorization: "Bearer header-token" },
    };
    expect(getAccessTokenFromRequest(req)).toBe("access-from-cookie");
  });
});
