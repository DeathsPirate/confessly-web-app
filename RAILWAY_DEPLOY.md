# 🚂 Deploy Confessly to Railway

## Step 1: Push to GitHub

1. **Create a new repository on GitHub:**
   - Go to [github.com](https://github.com) and create a new repository
   - Name it `confessly-web-app`
   - Don't initialize with README (we already have one)

2. **Push your code:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/confessly-web-app.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Deploy Backend to Railway

1. **Go to [railway.app](https://railway.app) and sign up**

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `confessly-web-app` repository

3. **Configure Backend Service:**
   - Railway will detect the root directory
   - Click "Add Service" → "GitHub Repo"
   - Set **Root Directory**: `backend`
   - Railway will auto-detect it's a Node.js app

4. **Set Environment Variables:**
   Go to your backend service → Variables tab and add:
   ```
   NODE_ENV=production
   JWT_SECRET=confessly-super-secure-jwt-secret-key-railway-2024
   PORT=3001
   FRONTEND_URL=https://confessly-frontend-production.up.railway.app
   ```
   (We'll update FRONTEND_URL after deploying the frontend)

5. **Deploy Backend:**
   - Railway will automatically build and deploy
   - Wait for deployment to complete
   - Copy your backend URL (e.g., `https://confessly-backend-production.up.railway.app`)

## Step 3: Deploy Frontend to Railway

1. **Add Frontend Service:**
   - In the same Railway project, click "New Service"
   - Select "GitHub Repo" 
   - Choose the same repository
   - Set **Root Directory**: `frontend`

2. **Set Environment Variables:**
   Go to frontend service → Variables tab and add:
   ```
   REACT_APP_API_URL=https://YOUR_BACKEND_URL.up.railway.app/api
   ```
   (Replace with your actual backend URL from Step 2)

3. **Deploy Frontend:**
   - Railway will build the React app
   - Wait for deployment to complete
   - Copy your frontend URL

## Step 4: Update Backend Configuration

1. **Update Backend Environment:**
   - Go back to backend service → Variables
   - Update `FRONTEND_URL` with your actual frontend URL:
   ```
   FRONTEND_URL=https://YOUR_FRONTEND_URL.up.railway.app
   ```

2. **Redeploy Backend:**
   - The backend will automatically redeploy with new CORS settings

## Step 5: Initialize Database

1. **Seed the Database:**
   - Go to backend service → "Deploy Logs"  
   - When deployment is complete, click "View Logs"
   - In another tab, go to your backend service and create a one-off command:
   - Or SSH into the container and run: `npm run seed`

**Alternative - Trigger via API:**
```bash
# Create a test confession to trigger database initialization
curl -X POST https://YOUR_BACKEND_URL.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","handle":"test_user"}'
```

## Step 6: Test Your Deployment

Visit your frontend URL and test:

1. **Health Check:** `https://YOUR_BACKEND_URL.up.railway.app/api/health`
2. **Frontend:** `https://YOUR_FRONTEND_URL.up.railway.app`
3. **Login with test accounts:**
   - alice@example.com / password123
   - moderator@example.com / password123

## 🎉 Success!

Your Confessly app is now live on Railway with:

- ✅ **Backend API**: Full confession system with AI assistant
- ✅ **Frontend Web App**: Responsive React application  
- ✅ **Database**: SQLite with seeded test data
- ✅ **AI Assistant**: Confessor Bot responding to confessions
- ✅ **Moderation Tools**: Available to users with 100+ karma
- ✅ **SSL/HTTPS**: Automatically provided by Railway

## Railway URLs

After deployment, you'll have:
- **Frontend**: `https://confessly-frontend-production.up.railway.app`
- **Backend**: `https://confessly-backend-production.up.railway.app`
- **API Health**: `https://confessly-backend-production.up.railway.app/api/health`

## Railway Benefits

- 🆓 **Free Tier**: 500 execution hours/month
- 🔒 **HTTPS**: Automatic SSL certificates
- 🚀 **Auto Deploy**: Deploys on every git push
- 📊 **Monitoring**: Built-in metrics and logs
- 💾 **Persistent Storage**: Database survives restarts
- 🌍 **Global CDN**: Fast worldwide access

## Managing Your Deployment

### View Logs
- Go to your service → "Deploy Logs" or "Application Logs"

### Restart Services
- Click "Redeploy" in the service dashboard

### Environment Variables
- Update in Variables tab, automatic redeploy

### Database Backup
- Railway automatically handles backups
- For manual backup, use the Railway CLI

### Custom Domain (Optional)
- Go to service → Settings → Domains
- Add your custom domain with CNAME

## Troubleshooting

### Backend Not Starting
- Check logs for errors
- Verify NODE_ENV=production is set
- Ensure JWT_SECRET is configured

### Frontend API Errors
- Verify REACT_APP_API_URL points to backend
- Check CORS settings (FRONTEND_URL in backend)
- Ensure both services are deployed

### Database Issues
- Redeploy backend service to recreate database
- Check if seeding completed successfully

---

## 🎊 Congratulations!

Your Confessly application is now live on Railway with all features:
- Anonymous confessions with AI responses
- User authentication and karma system
- Moderation tools and content flagging
- Data export functionality
- Mobile-responsive design

**Share your live app URL and start collecting confessions!**