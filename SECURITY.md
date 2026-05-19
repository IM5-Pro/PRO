# HRMS Security Notes

## Session tokens (SPA + API)

The API issues JWT access and refresh tokens as **HttpOnly** cookies (`hrms_access`, `hrms_refresh` by default). The React client sends `credentials: 'include'` on every API call and does **not** store JWTs in JavaScript-readable cookies.

User profile data (non-secret) is cached in `sessionStorage` under `hrms_user` for faster UI hydration; `/auth/me` re-validates the session on load.

### Environment variables

| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Token signing |
| `COOKIE_SECURE=true` | Force `Secure` cookies (recommended in production) |
| `COOKIE_SAME_SITE` | `lax` (default) or `strict` |
| `CLIENT_ORIGIN` | CORS allowlist entry for the SPA |
| `EXPOSE_TOKENS_IN_BODY=true` | **Dev only** — return tokens in login/refresh JSON (default: off) |

### Local development

- API: `http://localhost:7888` (or your `PORT`)
- Client: `http://localhost:3000`
- CORS must list the client origin and use `credentials: true` (configured in `server/index.js`).

## XSS mitigations

- JWTs are not exposed to `document.cookie` from the app.
- Do not use `dangerouslySetInnerHTML` for user content.
- Enable CSP (see `client/public/index.html` meta tag — adjust hosts for production API URL).

## CORS

`server/index.js` allowlists `CLIENT_ORIGIN` and localhost. Do not use `origin: true` in production.

## Permissions

Runtime checks use `server/src/config/permissions.js` (`ROLE_PERMISSIONS`). After changes, run:

```bash
cd server
npm test
npm run verify:nav-permissions
```

## Sensitive HR data

Employee PAN, Aadhaar, and bank details should be **encrypted at rest** and access-logged in a future phase.
