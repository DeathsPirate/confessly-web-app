@echo off
echo 🚀 Deploying Confessly to Production
echo ==================================

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.production .env
    echo ⚠️  Please edit .env file with your production values before continuing!
    echo    - Set a secure JWT_SECRET
    echo    - Update FRONTEND_URL and REACT_APP_API_URL with your domains
    pause
)

REM Build and start containers
echo 🏗️  Building Docker containers...
docker-compose build --no-cache

echo 🗄️  Starting containers...
docker-compose up -d

REM Wait for backend to be ready
echo ⏳ Waiting for backend to be ready...
timeout /t 10 /nobreak > nul

REM Seed database
echo 🌱 Seeding database with sample data...
docker-compose exec backend npm run seed

echo.
echo 🎉 Deployment Complete!
echo =======================
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:3001
echo 📊 Health Check: http://localhost:3001/api/health
echo.
echo Test Accounts:
echo 👤 Regular User: alice@example.com / password123
echo 🛡️  Moderator: moderator@example.com / password123
echo.
echo Management Commands:
echo 📋 View logs: docker-compose logs -f
echo 🔄 Restart: docker-compose restart
echo 🛑 Stop: docker-compose down

pause