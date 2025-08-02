const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const archiver = require('archiver');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
require('dotenv').config();

const { initializeDatabase, dbHelpers } = require('./database');
const aiAssistant = require('./aiAssistant');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Swagger API Documentation
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Confessly API Documentation'
}));

// OpenAPI JSON endpoints
app.get('/api/openapi.json', (req, res) => {
  res.json(swaggerDocument);
});

// Alternative endpoint for OpenAPI spec
app.get('/openapi.json', (req, res) => {
  res.json(swaggerDocument);
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Moderator middleware
const requireModerator = async (req, res, next) => {
  try {
    const user = await dbHelpers.getUserById(req.user.id);
    if (!user || user.karma < 100) {
      return res.status(403).json({ error: 'Moderator privileges required (100+ karma)' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// AI Assistant status check
app.get('/api/ai/status', (req, res) => {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  res.json({
    aiEnabled: hasOpenAI,
    aiType: hasOpenAI ? 'OpenAI GPT-3.5' : 'Rule-based responses',
    openaiConfigured: hasOpenAI,
    message: hasOpenAI 
      ? 'Real AI responses powered by OpenAI' 
      : 'Using intelligent rule-based responses (set OPENAI_API_KEY for real AI)'
  });
});

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, handle, bio, favoriteSnack } = req.body;

    if (!email || !password || !handle) {
      return res.status(400).json({ error: 'Email, password, and handle are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (handle.length < 3) {
      return res.status(400).json({ error: 'Handle must be at least 3 characters' });
    }

    const user = await dbHelpers.createUser(email, password, handle, bio || '', favoriteSnack || '');
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        handle: user.handle,
        bio: user.bio,
        favoriteSnack: user.favoriteSnack,
        karma: user.karma
      }
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'Email or handle already exists' });
    } else {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await dbHelpers.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.is_suspended) {
      return res.status(403).json({ error: 'Account is suspended' });
    }

    const isValidPassword = bcrypt.compareSync(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        handle: user.handle,
        bio: user.bio,
        favorite_snack: user.favorite_snack,
        karma: user.karma
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// User profile routes
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await dbHelpers.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      handle: user.handle,
      bio: user.bio,
      favorite_snack: user.favorite_snack,
      karma: user.karma,
      isModerator: user.karma >= 100,
      created_at: user.created_at
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Confession routes
app.post('/api/confessions', authenticateToken, async (req, res) => {
  try {
    const { content, mood, location, taggedUsers } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Confession content is required' });
    }

    if (content.length > 500) {
      return res.status(400).json({ error: 'Confession must be 500 characters or less' });
    }

    const confession = await dbHelpers.createConfession(
      req.user.id,
      content.trim(),
      mood || '',
      location || '',
      taggedUsers || ''
    );

    // Process confession with AI assistant (async, don't wait)
    setTimeout(async () => {
      try {
        await aiAssistant.processConfession({
          id: confession.id,
          content: confession.content,
          mood: confession.mood,
          location: confession.location,
          tagged_users: confession.taggedUsers
        });
      } catch (error) {
        console.error('AI Assistant processing error:', error);
      }
    }, Math.random() * 10000 + 2000); // Random delay 2-12 seconds to seem more natural

    res.status(201).json({
      message: 'Confession posted successfully',
      confession: {
        id: confession.id,
        content: confession.content,
        mood: confession.mood,
        location: confession.location,
        taggedUsers: confession.taggedUsers,
        upvotes: 0,
        downvotes: 0,
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Confession creation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/confessions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const confessions = await dbHelpers.getConfessions(limit, offset);
    
    res.json({
      confessions: confessions.map(confession => ({
        id: confession.id,
        content: confession.content,
        mood: confession.mood,
        location: confession.location,
        tagged_users: confession.tagged_users,
        upvotes: confession.upvotes,
        downvotes: confession.downvotes,
        created_at: confession.created_at,
        // Don't expose author info for anonymity
        author_handle: 'anonymous'
      })),
      page,
      limit
    });
  } catch (error) {
    console.error('Confessions fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Voting routes
app.post('/api/confessions/:id/vote', authenticateToken, async (req, res) => {
  try {
    const confessionId = parseInt(req.params.id);
    const { voteType } = req.body;

    if (!['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({ error: 'Invalid vote type' });
    }

    const confession = await dbHelpers.getConfessionById(confessionId);
    if (!confession) {
      return res.status(404).json({ error: 'Confession not found' });
    }

    const voteResult = await dbHelpers.castVote(req.user.id, confessionId, voteType);
    
    // Update user karma based on vote
    let karmaChange = 0;
    if (voteResult.action === 'added') {
      karmaChange = voteType === 'upvote' ? 1 : -1;
    } else if (voteResult.action === 'removed') {
      karmaChange = voteType === 'upvote' ? -1 : 1;
    } else if (voteResult.action === 'changed') {
      karmaChange = voteType === 'upvote' ? 2 : -2; // Remove old vote and add new
    }

    if (karmaChange !== 0) {
      await dbHelpers.updateUserKarma(confession.user_id, karmaChange);
    }

    // Get updated confession data
    const updatedConfession = await dbHelpers.getConfessionById(confessionId);

    res.json({
      message: 'Vote recorded successfully',
      voteResult,
      confession: {
        id: updatedConfession.id,
        upvotes: updatedConfession.upvotes,
        downvotes: updatedConfession.downvotes
      }
    });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Comments routes
app.post('/api/confessions/:id/comments', authenticateToken, async (req, res) => {
  try {
    const confessionId = parseInt(req.params.id);
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    if (content.length > 300) {
      return res.status(400).json({ error: 'Comment must be 300 characters or less' });
    }

    const confession = await dbHelpers.getConfessionById(confessionId);
    if (!confession) {
      return res.status(404).json({ error: 'Confession not found' });
    }

    const comment = await dbHelpers.createComment(req.user.id, confessionId, content.trim());

    res.status(201).json({
      message: 'Comment posted successfully',
      comment: {
        id: comment.id,
        content: comment.content,
        author_handle: 'anonymous',
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Comment creation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/confessions/:id/comments', async (req, res) => {
  try {
    const confessionId = parseInt(req.params.id);
    const comments = await dbHelpers.getCommentsByConfession(confessionId);

    res.json({
      comments: comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        author_handle: comment.author_handle, // Now includes AI bot identification
        created_at: comment.created_at
      }))
    });
  } catch (error) {
    console.error('Comments fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Flagging routes
app.post('/api/flag', authenticateToken, async (req, res) => {
  try {
    const { contentType, contentId, reason } = req.body;

    if (!['confession', 'comment'].includes(contentType)) {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    if (!contentId) {
      return res.status(400).json({ error: 'Content ID is required' });
    }

    await dbHelpers.flagContent(req.user.id, contentType, parseInt(contentId), reason || '');

    res.json({ message: 'Content flagged successfully' });
  } catch (error) {
    console.error('Flag error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Moderation routes (requires 100+ karma)
app.get('/api/moderation/flagged', authenticateToken, requireModerator, async (req, res) => {
  try {
    const flaggedContent = await dbHelpers.getFlaggedContent();
    res.json({ flaggedContent });
  } catch (error) {
    console.error('Moderation fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/moderation/:contentType/:id', authenticateToken, requireModerator, async (req, res) => {
  try {
    const { contentType, id } = req.params;
    
    if (!['confession', 'comment'].includes(contentType)) {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    const table = contentType === 'confession' ? 'confessions' : 'comments';
    
    // Mark as deleted instead of actual deletion for data integrity
    const { db } = require('./database');
    db.run(
      `UPDATE ${table} SET is_deleted = TRUE WHERE id = ?`,
      [parseInt(id)],
      (err) => {
        if (err) {
          console.error('Moderation delete error:', err);
          res.status(500).json({ error: 'Server error' });
        } else {
          res.json({ message: `${contentType} deleted successfully` });
        }
      }
    );
  } catch (error) {
    console.error('Moderation delete error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// AI Assistant routes
app.post('/api/ai/process-confession/:id', authenticateToken, requireModerator, async (req, res) => {
  try {
    const confessionId = parseInt(req.params.id);
    const confession = await dbHelpers.getConfessionById(confessionId);
    
    if (!confession) {
      return res.status(404).json({ error: 'Confession not found' });
    }

    const aiResponse = await aiAssistant.processConfession({
      id: confession.id,
      content: confession.content,
      mood: confession.mood,
      location: confession.location,
      tagged_users: confession.tagged_users
    });

    if (aiResponse) {
      res.json({ 
        message: 'AI response generated', 
        response: aiResponse 
      });
    } else {
      res.json({ 
        message: 'AI chose not to respond to this confession' 
      });
    }
  } catch (error) {
    console.error('AI processing error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/ai/process-all', authenticateToken, requireModerator, async (req, res) => {
  try {
    const confessions = await dbHelpers.getConfessions(50, 0);
    const responses = [];

    for (const confession of confessions) {
      const aiResponse = await aiAssistant.processConfession({
        id: confession.id,
        content: confession.content,
        mood: confession.mood,
        location: confession.location,
        tagged_users: confession.tagged_users
      });
      
      if (aiResponse) {
        responses.push(aiResponse);
      }
    }

    res.json({ 
      message: `AI generated ${responses.length} responses`,
      responses 
    });
  } catch (error) {
    console.error('AI batch processing error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Data export route
app.get('/api/user/export', authenticateToken, async (req, res) => {
  try {
    const userData = await dbHelpers.getUserData(req.user.id);
    
    const fileName = `confessly-data-${req.user.id}-${Date.now()}.json`;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    res.json({
      exported_at: new Date().toISOString(),
      user_data: userData
    });
  } catch (error) {
    console.error('Data export error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`Confessly backend server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();