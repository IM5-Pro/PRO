/**
 * HttpOnly session cookies for JWT access + refresh tokens.
 * Clients must use `credentials: 'include'`; tokens are not readable from JavaScript.
 */

export const ACCESS_COOKIE_NAME = process.env.ACCESS_COOKIE_NAME || "hrms_access";
export const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME || "hrms_refresh";

const LEGACY_ACCESS_COOKIE = "authToken";
const LEGACY_REFRESH_COOKIE = "refreshToken";

const ACCESS_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const isSecureCookie = () =>
  process.env.NODE_ENV === "production" || process.env.COOKIE_SECURE === "true";

const baseCookieOptions = () => ({
  httpOnly: true,
  secure: isSecureCookie(),
  sameSite: process.env.COOKIE_SAME_SITE || "lax",
  path: "/",
});

export const setAuthCookies = (res, { accessToken, refreshToken }) => {
  const base = baseCookieOptions();

  if (accessToken) {
    res.cookie(ACCESS_COOKIE_NAME, accessToken, {
      ...base,
      maxAge: ACCESS_MAX_AGE_MS,
    });
  }

  if (refreshToken) {
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      ...base,
      maxAge: REFRESH_MAX_AGE_MS,
    });
  }

  // Clear legacy JS-readable cookies if they exist from older builds.
  res.clearCookie(LEGACY_ACCESS_COOKIE, { path: "/", sameSite: base.sameSite });
  res.clearCookie(LEGACY_REFRESH_COOKIE, { path: "/", sameSite: base.sameSite });
};

export const clearAuthCookies = (res) => {
  const base = baseCookieOptions();
  res.clearCookie(ACCESS_COOKIE_NAME, base);
  res.clearCookie(REFRESH_COOKIE_NAME, base);
  res.clearCookie(LEGACY_ACCESS_COOKIE, { path: "/", sameSite: base.sameSite });
  res.clearCookie(LEGACY_REFRESH_COOKIE, { path: "/", sameSite: base.sameSite });
};

export const getAccessTokenFromRequest = (req) => {
  if (req.cookies?.[ACCESS_COOKIE_NAME]) {
    return req.cookies[ACCESS_COOKIE_NAME];
  }

  if (req.cookies?.[LEGACY_ACCESS_COOKIE]) {
    return req.cookies[LEGACY_ACCESS_COOKIE];
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  return null;
};

export const getRefreshTokenFromRequest = (req) => {
  if (req.cookies?.[REFRESH_COOKIE_NAME]) {
    return req.cookies[REFRESH_COOKIE_NAME];
  }

  if (req.cookies?.[LEGACY_REFRESH_COOKIE]) {
    return req.cookies[LEGACY_REFRESH_COOKIE];
  }

  const bodyToken = req.body?.refreshToken;
  if (typeof bodyToken === "string" && bodyToken.trim()) {
    return bodyToken.trim();
  }

  return null;
};

export const shouldExposeTokensInBody = () => process.env.EXPOSE_TOKENS_IN_BODY === "true";
