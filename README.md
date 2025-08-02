# Confessly - Anonymous Confession Web App

Confessly is a social web application that allows users to anonymously post confessions, interact with others' posts, and earn reputation ("karma") based on community engagement.

## Features

### 🔐 Authentication & User Management
- User registration and login (email + password)
- User profiles with handle, bio, and favorite snack
- Secure password hashing with bcrypt
- JWT-based authentication

### 📝 Anonymous Confessions
- Post anonymous confessions (up to 500 characters)
- Optional metadata: mood, location, tagged users
- Timestamped confession feed
- Upvote/downvote system
- Anonymous commenting system

### ⭐ Karma System
- Gain/lose karma based on upvotes/downvotes
- +1 karma per upvote, -1 karma per downvote
- Karma displayed in user profiles

### 🛡️ Moderation System
- Users with 100+ karma unlock moderator privileges
- Flag confessions and comments for review
- Moderators can delete flagged content
- Moderation queue for content review

### 📊 Data Export
- Users can download all their data
- Includes confessions, comments, and profile information
- JSON format export

## Tech Stack

### Backend
- **Node.js** with Express.js
- **SQLite** database
- **JWT** for authentication
- **bcrypt** for password hashing
- **CORS** and **Helmet** for security
- **Rate limiting** for API protection

### Frontend
- **React** with TypeScript
- **React Router** for navigation
- **Axios** for API calls
- **Lucide React** for icons
- **CSS** for styling

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and update the JWT_SECRET with a secure key.

4. Seed the database with sample data:
   ```bash
   npm run seed
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```

The backend will be available at `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

## Test Accounts

The following test accounts are available after running the seed script:

### Regular Users
- **Email:** alice@example.com, **Password:** password123, **Handle:** alice_wonder
- **Email:** bob@example.com, **Password:** password123, **Handle:** bob_builder
- **Email:** charlie@example.com, **Password:** password123, **Handle:** charlie_brown
- **Email:** diana@example.com, **Password:** password123, **Handle:** wonder_diana

### Moderator Account
- **Email:** moderator@example.com, **Password:** password123, **Handle:** mod_supreme
- This account has 150+ karma and full moderator privileges

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### User Management
- `GET /api/user/profile` - Get user profile
- `GET /api/user/export` - Export user data

### Confessions
- `GET /api/confessions` - Get confession feed
- `POST /api/confessions` - Create new confession
- `POST /api/confessions/:id/vote` - Vote on confession
- `GET /api/confessions/:id/comments` - Get confession comments
- `POST /api/confessions/:id/comments` - Add comment

### Moderation (100+ karma required)
- `GET /api/moderation/flagged` - Get flagged content
- `DELETE /api/moderation/:contentType/:id` - Delete content

### Flagging
- `POST /api/flag` - Flag content for review

## Project Structure

```
confessly_web_app/
├── backend/
│   ├── server.js           # Main server file
│   ├── database.js         # Database setup and helpers
│   ├── scripts/
│   │   └── seed.js         # Database seeding script
│   ├── package.json
│   ├── .env.example
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── App.tsx         # Main app component
│   │   ├── App.css         # Styles
│   │   └── index.tsx       # Entry point
│   └── package.json
└── README.md
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting on API endpoints
- CORS protection
- Helmet for security headers
- Input validation and sanitization
- Anonymous posting (no author tracking)

## Development

### Backend Development
```bash
cd backend
npm run dev  # Starts nodemon for auto-restart
```

### Frontend Development
```bash
cd frontend
npm start    # Starts React development server
```

### Database Reset
To reset the database and re-seed:
```bash
cd backend
rm confessly.db  # Remove existing database
npm run seed     # Re-create and seed database
```

## Production Deployment

1. Set `NODE_ENV=production` in backend `.env`
2. Update `JWT_SECRET` with a strong production key
3. Build the React frontend: `npm run build` in frontend directory
4. Serve the built files with a web server
5. Use a process manager like PM2 for the backend

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

---

**Generated with [Memex](https://memex.tech)**  
Co-Authored-By: Memex <noreply@memex.tech>