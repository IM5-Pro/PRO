import rateLimit from "express-rate-limit";

const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 1 minute.",
  },
});

export { loginRateLimiter };
