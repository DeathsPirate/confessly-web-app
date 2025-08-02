# Confessly Deployment Guide

This document provides detailed instructions for deploying Confessly in various environments.

## Quick Start (Development)

1. **Clone or navigate to the project directory**
2. **Install dependencies for both frontend and backend:**
   ```bash
   npm run install:all
   ```
3. **Seed the database:**
   ```bash
   npm run seed
   ```
4. **Start development servers:**
   - Backend: `npm run dev:backend` (runs on http://localhost:3001)
   - Frontend: `npm run dev:frontend` (runs on http://localhost:3000)

## Production Deployment Options

### Option 1: Docker Deployment (Recommended)

#### Prerequisites
- Docker and Docker Compose installed

#### Steps
1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd confessly_web_app
   ```

2. **Update environment variables:**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env and set production values
   ```

3. **Build and start containers:**
   ```bash
   npm run docker:build
   npm run docker:up
   ```

4. **Seed the database (first time only):**
   ```bash
   docker-compose exec backend npm run seed
   ```

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

#### Docker Management Commands
```bash
# View logs
npm run docker:logs

# Stop containers
npm run docker:down

# Rebuild containers
npm run docker:build

# Restart containers
npm run docker:down && npm run docker:up
```

### Option 2: Manual Production Deployment

#### Backend Deployment

1. **Prepare the server:**
   ```bash
   # Install Node.js 18+ and npm
   # Install PM2 for process management
   npm install -g pm2
   ```

2. **Deploy backend:**
   ```bash
   cd backend
   npm ci --production
   
   # Set up environment
   cp .env.example .env
   # Edit .env with production values
   
   # Seed database (first time only)
   npm run seed
   
   # Start with PM2
   pm2 start server.js --name "confessly-backend"
   pm2 save
   pm2 startup
   ```

#### Frontend Deployment

1. **Build the frontend:**
   ```bash
   cd frontend
   npm ci
   npm run build
   ```

2. **Deploy to web server:**
   ```bash
   # Copy build files to your web server
   cp -r build/* /var/www/html/
   
   # Configure web server (Apache/Nginx) for SPA routing
   ```

#### Nginx Configuration Example
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
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

### Option 3: Cloud Platform Deployment

#### Heroku Deployment

1. **Prepare for Heroku:**
   ```bash
   # Create Procfile in backend directory
   echo "web: npm start" > backend/Procfile
   
   # Update backend package.json scripts
   "start": "node server.js"
   ```

2. **Deploy backend:**
   ```bash
   cd backend
   heroku create confessly-backend
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-production-jwt-secret
   git init
   git add .
   git commit -m "Initial backend deployment"
   git push heroku main
   ```

3. **Deploy frontend:**
   ```bash
   cd frontend
   # Update REACT_APP_API_URL in build process
   heroku create confessly-frontend
   heroku buildpacks:set https://github.com/mars/create-react-app-buildpack
   git init
   git add .
   git commit -m "Initial frontend deployment"
   git push heroku main
   ```

#### Vercel Deployment (Frontend)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   cd frontend
   vercel --prod
   ```

3. **Configure environment variables in Vercel dashboard:**
   - `REACT_APP_API_URL`: Your backend API URL

#### Railway/Render Deployment

Similar to Heroku but with platform-specific configurations.

## Environment Variables

### Backend (.env)
```bash
# Server Configuration
PORT=3001
NODE_ENV=production

# Security (REQUIRED - Generate strong secret)
JWT_SECRET=your-super-secure-jwt-secret-key-here

# Frontend URL (for CORS)
FRONTEND_URL=https://your-frontend-domain.com

# Database (SQLite file path)
DATABASE_PATH=./confessly.db
```

### Frontend Environment Variables
```bash
# API endpoint
REACT_APP_API_URL=https://your-backend-domain.com/api
```

## Database Management

### Backup Database
```bash
# SQLite backup
cp backend/confessly.db backup/confessly-$(date +%Y%m%d).db
```

### Restore Database
```bash
# Stop application
cp backup/confessly-backup.db backend/confessly.db
# Restart application
```

### Reset Database
```bash
cd backend
rm confessly.db
npm run seed
```

## Security Considerations

### Production Security Checklist

- [ ] Change default JWT_SECRET to a strong, unique value
- [ ] Use HTTPS in production
- [ ] Configure proper CORS origins
- [ ] Set up rate limiting (already implemented)
- [ ] Regular database backups
- [ ] Monitor application logs
- [ ] Keep dependencies updated
- [ ] Use environment variables for sensitive data
- [ ] Configure proper nginx/reverse proxy settings

### SSL/HTTPS Setup

1. **Obtain SSL certificate (Let's Encrypt recommended):**
   ```bash
   certbot --nginx -d your-domain.com
   ```

2. **Update nginx configuration for HTTPS**

## Monitoring and Maintenance

### Log Monitoring
```bash
# PM2 logs
pm2 logs

# Docker logs
docker-compose logs -f

# System logs
tail -f /var/log/nginx/access.log
```

### Performance Monitoring
- Set up application monitoring (e.g., New Relic, DataDog)
- Monitor database performance
- Set up uptime monitoring

### Regular Maintenance
- Weekly database backups
- Monthly dependency updates
- Monitor disk space usage
- Review application logs

## Troubleshooting

### Common Issues

1. **"CORS error"**
   - Check FRONTEND_URL in backend .env
   - Verify API_URL in frontend environment

2. **"Database locked" error**
   - Restart the application
   - Check file permissions

3. **"Module not found" errors**
   - Run `npm ci` to reinstall dependencies
   - Check Node.js version compatibility

4. **Frontend shows blank page**
   - Check browser console for errors
   - Verify API endpoint is reachable
   - Check nginx configuration for SPA routing

### Health Checks

```bash
# Backend health
curl http://localhost:3001/api/health

# Frontend build
cd frontend && npm run build

# Database connection
cd backend && node -e "const {db} = require('./database'); db.get('SELECT 1', console.log)"
```

## Scaling Considerations

### Horizontal Scaling
- Use load balancer (nginx, HAProxy)
- Database clustering (if moving beyond SQLite)
- CDN for static assets

### Performance Optimization
- Enable gzip compression
- Implement caching strategies
- Optimize database queries
- Use CDN for static assets

---

For additional support, refer to the main README.md or create an issue in the project repository.