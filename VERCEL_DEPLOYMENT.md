# Vercel Deployment Guide for HRMS

## Step-by-Step Deployment Instructions

### Prerequisites
1. Vercel account (free at https://vercel.com)
2. GitHub account with your code pushed to a repository
3. MongoDB Atlas account (or your MongoDB URI)
4. Environment variables prepared

---

## Part 1: Deploy Backend (Express Server) to Vercel

### 1. Push Backend to GitHub
```bash
cd server
git init
git add .
git commit -m "Initial commit - HRMS backend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/hrms-backend.git
git push -u origin main
```

### 2. Create Vercel Project for Backend
```bash
npm i -g vercel
vercel login
vercel
```

Or manually:
1. Go to https://vercel.com/new
2. Select "Other" as the template
3. Connect your GitHub repository (hrms-backend)
4. Configure project settings:
   - Framework: Node.js
   - Root Directory: `./` (or `./server` if in monorepo)
   - Build Command: `npm install`
   - Output Directory: (leave empty)
   - Install Command: `npm install`
   - Start Command: `node index.js`

### 3. Add Environment Variables to Vercel Console
Go to your Vercel project → Settings → Environment Variables → Add:

```
MONGODB_URI = your_mongodb_connection_string
JWT_SECRET = your_jwt_secret_key
CLIENT_ORIGIN = https://your-frontend-url.vercel.app
NODE_ENV = production
```

### 4. Deploy
```bash
vercel --prod
```

**Note your Backend API URL:** (e.g., `https://hrms-api.vercel.app`)

---

## Part 2: Deploy Frontend (React) to Vercel

### 1. Update API Endpoint Configuration
Edit `client/src/api/client.js` and update the API base URL:

```javascript
// Before deployment, ensure this points to your Vercel backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

### 2. Create `.env.production` in client folder

```
REACT_APP_API_URL=https://your-hrms-api.vercel.app
REACT_APP_ENVIRONMENT=production
```

### 3. Push Frontend to GitHub
```bash
cd ../client
git init
git add .
git commit -m "Initial commit - HRMS frontend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/hrms-frontend.git
git push -u origin main
```

### 4. Create Vercel Project for Frontend
1. Go to https://vercel.com/new
2. Import your GitHub repository (hrms-frontend)
3. Configure project settings:
   - Framework: Create React App
   - Root Directory: `./` (or `./client` if in monorepo)
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

### 5. Add Environment Variables
In Vercel console → Settings → Environment Variables:

```
REACT_APP_API_URL=https://your-hrms-api.vercel.app
```

### 6. Deploy Frontend
```bash
vercel --prod
```

---

## Part 3: Configure CORS on Backend

Update your backend `src/config/cors.js` or the main `index.js`:

```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  process.env.CLIENT_ORIGIN,
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
}));
```

---

## Part 4: Update Frontend API Endpoints

In `client/src/api/client.js`, ensure your API client uses the environment variable:

```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

export default client;
```

---

## Environment Variables Checklist

### Backend (Vercel)
- [ ] `MONGODB_URI` - Your MongoDB connection string
- [ ] `JWT_SECRET` - Secret key for JWT tokens (generate: `openssl rand -base64 32`)
- [ ] `CLIENT_ORIGIN` - Your frontend Vercel URL
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` (Optional, Vercel sets automatically)

### Frontend (Vercel)
- [ ] `REACT_APP_API_URL` - Your backend API URL (e.g., https://hrms-api.vercel.app)

---

## Testing Deployment

1. **Test Backend API:**
   ```
   curl https://your-hrms-api.vercel.app/health
   ```

2. **Test Frontend:**
   - Visit https://your-hrms-frontend.vercel.app
   - Login with credentials
   - Check browser console for API errors

3. **Check Logs:**
   - Backend: Vercel Dashboard → Logs
   - Frontend: Vercel Dashboard → Logs

---

## Troubleshooting

### Issue: "Cannot find module"
**Solution:** Run `npm install` in Vercel or ensure all dependencies are in `package.json`

### Issue: CORS Error
**Solution:** Update `CLIENT_ORIGIN` environment variable in backend and restart deployment

### Issue: API calls return 404
**Solution:** Verify `REACT_APP_API_URL` in frontend environment variables

### Issue: MongoDB connection fails
**Solution:** 
1. Check `MONGODB_URI` is correct
2. Add Vercel IPs to MongoDB Atlas whitelist:
   - Go to MongoDB Atlas → Network Access
   - Allow IP: `0.0.0.0/0` (for development, restrict in production)

### Issue: Blank page on frontend
**Solution:**
- Check browser console for errors
- Verify `REACT_APP_API_URL` environment variable is set
- Run `npm run build` locally to verify build succeeds

---

## Production Optimization Tips

1. **Enable caching** in Vercel settings
2. **Configure custom domain** for both frontend and backend
3. **Set up CI/CD** - auto-deploy on git push
4. **Monitor performance** in Vercel Analytics
5. **Use Vercel Postgres** if scaling database
6. **Add error tracking** (Sentry, LogRocket)

---

## Quick Deploy Commands

```bash
# From root directory
# Deploy Backend
cd server
vercel --prod

# Deploy Frontend  
cd ../client
vercel --prod
```

---

## Additional Resources
- [Vercel Node.js Deployment](https://vercel.com/docs/functions/runtimes/node-js)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Vercel Custom Domains](https://vercel.com/docs/concepts/projects/domains)

---

**Note:** Replace `your-hrms-api` and `your-hrms-frontend` with your actual Vercel project URLs.
