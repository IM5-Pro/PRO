/**
 * Baseline security headers for API responses.
 * CSP for the React app is primarily set in client/public/index.html.
 */
const securityHeaders = (_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=(), camera=()');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  next();
};

export default securityHeaders;
