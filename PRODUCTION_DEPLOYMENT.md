# 🚀 Confessly Production Deployment Guide

This guide covers multiple production deployment options for Confessly.

## 🎯 Quick Start - Docker Deployment

### Prerequisites
- Docker and Docker Compose installed
- 2GB RAM minimum
- 10GB disk space

### One-Command Deployment
```bash
# Windows
deploy.bat

# Linux/Mac
chmod +x deploy.sh
./deploy.sh
```

## ☁️ Cloud Platform Deployments

### Option 1: Railway (Recommended - Free Tier Available)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/confessly.git
   git push -u origin main
   ```

2. **Deploy Backend:**
   - Go to [railway.app](https://railway.app)
   - Connect GitHub repo
   - Select `backend` folder as root
   - Set environment variables:
     ```
     NODE_ENV=production
     JWT_SECRET=your-super-secure-jwt-secret-here
     FRONTEND_URL=https://your-frontend-domain.railway.app
     ```

3. **Deploy Frontend:**
   - Create new Railway service
   - Connect same GitHub repo
   - Select `frontend` folder as root
   - Set build command: `npm run build`
   - Set environment variables:
     ```
     REACT_APP_API_URL=https://your-backend-domain.railway.app/api
     ```

4. **Initialize Database:**
   ```bash
   # SSH into Railway backend container
   npm run seed
   ```

### Option 2: Render

1. **Create render.yaml in project root** (already created)
2. **Connect GitHub repo at [render.com](https://render.com)**
3. **Services will auto-deploy based on render.yaml**

### Option 3: Vercel + Railway/Heroku

**Frontend (Vercel):**
```bash
npm install -g vercel
cd frontend
vercel --prod
```

**Backend (Railway/Heroku):**
```bash
# Railway
railway login
railway init
railway up

# Heroku
heroku create confessly-backend
git subtree push --prefix=backend heroku main
```

## 🏠 VPS/Self-Hosted Deployment

### Option 1: Docker on VPS

1. **Prepare VPS:**
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **Deploy Application:**
   ```bash
   # Clone repository
   git clone https://github.com/yourusername/confessly.git
   cd confessly
   
   # Configure environment
   cp .env.production .env
   # Edit .env with your production values
   
   # Deploy
   ./deploy.sh
   ```

3. **Setup Reverse Proxy (Nginx):**
   ```nginx
   # /etc/nginx/sites-available/confessly
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
       
       location /api {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Enable HTTPS with Let's Encrypt:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

### Option 2: PM2 Deployment

1. **Install Dependencies:**
   ```bash
   # Install Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2
   npm install -g pm2
   ```

2. **Deploy Backend:**
   ```bash
   cd backend
   npm ci --production
   cp .env.example .env
   # Edit .env with production values
   npm run seed
   pm2 start server.js --name "confessly-backend"
   ```

3. **Deploy Frontend:**
   ```bash
   cd frontend
   npm ci
   npm run build
   # Serve with nginx or apache
   ```

## 🔐 Security Configuration

### Environment Variables

**Backend (.env):**
```bash
NODE_ENV=production
PORT=3001
JWT_SECRET=use-a-super-secure-64-character-random-string-here
FRONTEND_URL=https://your-frontend-domain.com
DATABASE_PATH=./data/confessly.db
```

**Frontend:**
```bash
REACT_APP_API_URL=https://your-backend-domain.com/api
```

### Security Checklist
- [ ] Strong JWT secret (64+ random characters)
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Database backups configured
- [ ] Regular security updates
- [ ] Monitoring and logging setup
- [ ] Rate limiting configured (already implemented)
- [ ] CORS properly configured
- [ ] Environment variables secured

## 📊 Monitoring & Maintenance

### Health Checks
```bash
# Check application health
curl https://your-backend-domain.com/api/health

# Check database
docker-compose exec backend node -e "const {db} = require('./database'); db.get('SELECT 1', console.log)"
```

### Backup Database
```bash
# Docker deployment
docker-compose exec backend cp /app/data/confessly.db /app/backup-$(date +%Y%m%d).db

# Manual deployment
cp backend/confessly.db backup/confessly-$(date +%Y%m%d).db
```

### Update Application
```bash
# Docker deployment
git pull
docker-compose build --no-cache
docker-compose up -d

# PM2 deployment
git pull
cd backend && npm ci --production
cd ../frontend && npm ci && npm run build
pm2 restart confessly-backend
```

## 🔍 Troubleshooting

### Common Issues

1. **"Module not found" errors:**
   ```bash
   # Rebuild node_modules
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Database locked:**
   ```bash
   # Restart application
   docker-compose restart backend
   # OR
   pm2 restart confessly-backend
   ```

3. **CORS errors:**
   - Check FRONTEND_URL in backend .env
   - Verify REACT_APP_API_URL in frontend

4. **Build failures:**
   ```bash
   # Clear Docker cache
   docker system prune -a
   
   # Clear npm cache
   npm cache clean --force
   ```

### Logs
```bash
# Docker logs
docker-compose logs -f

# PM2 logs
pm2 logs confessly-backend

# System logs
sudo journalctl -u nginx -f
```

## 📈 Performance Optimization

### Production Optimizations
- Enable gzip compression in reverse proxy
- Set up CDN for static assets
- Configure database indexing
- Implement Redis caching (if needed)
- Set up horizontal scaling

### Scaling Considerations
- Load balancer for multiple instances
- Database migration to PostgreSQL
- Session storage in Redis
- File upload handling with cloud storage

## 🎉 Success!

After deployment, your Confessly application will be available with:

- ✅ Anonymous confession posting
- ✅ Voting and karma system
- ✅ AI assistant responses
- ✅ Moderation tools
- ✅ Data export functionality
- ✅ Responsive design
- ✅ Production security

### Test Accounts
- **Regular User:** alice@example.com / password123
- **Moderator:** moderator@example.com / password123

---

**Need help?** Check the main README.md or create an issue in the repository.

**Production URL:** https://your-domain.com  
**Admin Panel:** Login as moderator to access moderation tools  
**API Docs:** https://your-domain.com/api/health