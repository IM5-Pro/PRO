/**
 * Baseline security headers for API responses.
 * React CSP (script/connect, etc.) is in client/public/index.html meta.
 * frame-ancestors only works on HTTP headers — use X-Frame-Options here (and CSP header on static host in production).
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
