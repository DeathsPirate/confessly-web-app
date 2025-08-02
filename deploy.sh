#!/bin/bash

# Confessly Production Deployment Script

echo "🚀 Deploying Confessly to Production"
echo "=================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.production .env
    echo "⚠️  Please edit .env file with your production values before continuing!"
    echo "   - Set a secure JWT_SECRET"
    echo "   - Update FRONTEND_URL and REACT_APP_API_URL with your domains"
    read -p "Press Enter after updating .env file..."
fi

# Build and start containers
echo "🏗️  Building Docker containers..."
docker-compose build --no-cache

echo "🗄️  Starting containers..."
docker-compose up -d

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:3001/api/health > /dev/null; then
        echo "✅ Backend is ready!"
        break
    fi
    echo "   Waiting... ($i/30)"
    sleep 2
done

# Seed database
echo "🌱 Seeding database with sample data..."
docker-compose exec backend npm run seed

echo ""
echo "🎉 Deployment Complete!"
echo "======================="
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:3001"
echo "📊 Health Check: http://localhost:3001/api/health"
echo ""
echo "Test Accounts:"
echo "👤 Regular User: alice@example.com / password123"
echo "🛡️  Moderator: moderator@example.com / password123"
echo ""
echo "Management Commands:"
echo "📋 View logs: docker-compose logs -f"
echo "🔄 Restart: docker-compose restart"
echo "🛑 Stop: docker-compose down"
echo "🧹 Clean rebuild: docker-compose down && docker-compose build --no-cache && docker-compose up -d"