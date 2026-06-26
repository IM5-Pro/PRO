# Vercel Deployment Checklist

## Pre-Deployment

### Backend Setup
- [ ] All code committed to GitHub
- [ ] No sensitive data in `.env` file (use example files only)
- [ ] MongoDB Atlas setup complete with connection string
- [ ] JWT_SECRET generated (`openssl rand -base64 32`)
- [ ] `vercel.json` created in server root
- [ ] CORS properly configured to accept frontend URL
- [ ] All npm dependencies listed in `package.json`

### Frontend Setup
- [ ] All code committed to GitHub
- [ ] `vercel.json` created in client root
- [ ] `.env.production` with correct `REACT_APP_API_URL`
- [ ] Build command works locally: `npm run build`
- [ ] No hardcoded API URLs (using env variables)
- [ ] All npm dependencies listed in `package.json`

---

## Deployment Steps

### Backend Deployment (Do First!)

1. **Push to GitHub**
   ```bash
   cd server
   git init
   git add .
   git commit -m "HRMS Backend - Ready for Vercel"
   git remote add origin https://github.com/YOUR_USERNAME/hrms-backend.git
   git push -u origin main
   ```

2. **Create Vercel Project**
   - [ ] Go to https://vercel.com/new
   - [ ] Connect your GitHub repo
   - [ ] Set Framework: "Other"
   - [ ] Keep default build settings
   - [ ] Click "Deploy"

3. **Add Environment Variables**
   - [ ] Go to Settings → Environment Variables
   - [ ] Add `MONGODB_URI`
   - [ ] Add `JWT_SECRET`
   - [ ] Add `CLIENT_ORIGIN` (will update after frontend deployed)
   - [ ] Add `NODE_ENV=production`
   - [ ] Re-deploy after adding variables

4. **Note Your API URL**
   - Format: `https://hrms-api-{random}.vercel.app`
   - Save this for frontend configuration

**✅ Backend Live!**

---

### Frontend Deployment

1. **Update Environment File**
   - [ ] Create `client/.env.production`
   - [ ] Set `REACT_APP_API_URL=https://your-backend-url.vercel.app`

2. **Push to GitHub**
   ```bash
   cd ../client
   git init
   git add .
   git commit -m "HRMS Frontend - Ready for Vercel"
   git remote add origin https://github.com/YOUR_USERNAME/hrms-frontend.git
   git push -u origin main
   ```

3. **Create Vercel Project**
   - [ ] Go to https://vercel.com/new
   - [ ] Connect your GitHub repo
   - [ ] Set Framework: "Create React App"
   - [ ] Keep default settings
   - [ ] Click "Deploy"

4. **Add Environment Variables**
   - [ ] Go to Settings → Environment Variables
   - [ ] Add `REACT_APP_API_URL=https://your-backend-url.vercel.app`
   - [ ] Re-deploy

**✅ Frontend Live!**

---

### Backend Post-Frontend Setup

1. **Update Backend Environment Variables**
   - [ ] Go back to backend Vercel project
   - [ ] Settings → Environment Variables
   - [ ] Update `CLIENT_ORIGIN` with your frontend URL: `https://your-frontend-url.vercel.app`
   - [ ] Click "Re-deploy"

---

## Testing Checklist

### Backend Tests
- [ ] API health check: `curl https://your-api.vercel.app/health` (or test endpoint)
- [ ] MongoDB connection working
- [ ] Check Vercel logs for errors
- [ ] CORS headers present for frontend URL

### Frontend Tests
- [ ] Frontend loads without errors
- [ ] Login page appears
- [ ] Can submit login request
- [ ] No CORS errors in browser console
- [ ] API calls return expected data
- [ ] Check browser Network tab for 200 responses

### End-to-End Tests
- [ ] User login works
- [ ] Can view dashboard
- [ ] Can perform CRUD operations
- [ ] No 500 errors in Network tab
- [ ] Responsive on mobile/tablet

---

## Common Issues & Quick Fixes

| Issue | Solution |
|-------|----------|
| CORS errors | Check `CLIENT_ORIGIN` in backend env vars matches frontend URL |
| API calls fail | Verify `REACT_APP_API_URL` in frontend env vars |
| Blank page | Check browser console, verify build succeeded locally |
| 502 errors | Check backend logs, verify MongoDB connection |
| Timeout errors | Increase timeout in axios client, check MongoDB Atlas |

---

## Post-Deployment

- [ ] Monitor Vercel Analytics
- [ ] Set up error tracking (Sentry, Datadog)
- [ ] Configure custom domains for both frontend & backend
- [ ] Enable auto-deployments on git push
- [ ] Set up backup strategy for database
- [ ] Test monthly deployment updates
- [ ] Document any custom configurations

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Node.js Runtime**: https://vercel.com/docs/functions/runtimes/node-js
- **Environment Variables**: https://vercel.com/docs/projects/environment-variables
- **Deployment Issues**: https://vercel.com/support

---

## Contacts & Credentials Storage

**Keep these safe!**
- [ ] GitHub personal access token
- [ ] MongoDB Atlas connection string
- [ ] JWT_SECRET
- [ ] Vercel project links

Use Vercel's environment variables - never commit secrets!

---

**Estimated Time:** 15-20 minutes total
**Difficulty Level:** Intermediate
