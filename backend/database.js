const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'confessly.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          handle TEXT UNIQUE NOT NULL,
          bio TEXT DEFAULT '',
          favorite_snack TEXT DEFAULT '',
          karma INTEGER DEFAULT 0,
          is_suspended BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Confessions table
      db.run(`
        CREATE TABLE IF NOT EXISTS confessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          mood TEXT DEFAULT '',
          location TEXT DEFAULT '',
          tagged_users TEXT DEFAULT '',
          upvotes INTEGER DEFAULT 0,
          downvotes INTEGER DEFAULT 0,
          is_flagged BOOLEAN DEFAULT FALSE,
          is_deleted BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Comments table
      db.run(`
        CREATE TABLE IF NOT EXISTS comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          confession_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          is_flagged BOOLEAN DEFAULT FALSE,
          is_deleted BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (confession_id) REFERENCES confessions (id),
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Votes table (to track user votes)
      db.run(`
        CREATE TABLE IF NOT EXISTS votes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          confession_id INTEGER NOT NULL,
          vote_type TEXT NOT NULL, -- 'upvote' or 'downvote'
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, confession_id),
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (confession_id) REFERENCES confessions (id)
        )
      `);

      // Flags table
      db.run(`
        CREATE TABLE IF NOT EXISTS flags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          content_type TEXT NOT NULL, -- 'confession' or 'comment'
          content_id INTEGER NOT NULL,
          reason TEXT DEFAULT '',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Sessions table (for JWT blacklisting if needed)
      db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token_hash TEXT NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
}

// Helper functions for database operations
const dbHelpers = {
  // User operations
  createUser: (email, password, handle, bio = '', favoriteSnack = '') => {
    return new Promise((resolve, reject) => {
      const passwordHash = bcrypt.hashSync(password, 10);
      const stmt = db.prepare(`
        INSERT INTO users (email, password_hash, handle, bio, favorite_snack)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run([email, passwordHash, handle, bio, favoriteSnack], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, email, handle, bio, favoriteSnack, karma: 0 });
        }
      });
      stmt.finalize();
    });
  },

  getUserByEmail: (email) => {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE email = ?',
        [email],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  },

  getUserById: (id) => {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT id, email, handle, bio, favorite_snack, karma, is_suspended, created_at FROM users WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  },

  updateUserKarma: (userId, karmaChange) => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET karma = karma + ? WHERE id = ?',
        [karmaChange, userId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  },

  // Confession operations
  createConfession: (userId, content, mood = '', location = '', taggedUsers = '') => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO confessions (user_id, content, mood, location, tagged_users)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run([userId, content, mood, location, taggedUsers], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, userId, content, mood, location, taggedUsers });
        }
      });
      stmt.finalize();
    });
  },

  getConfessions: (limit = 50, offset = 0) => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT c.*, u.handle as author_handle
        FROM confessions c
        JOIN users u ON c.user_id = u.id
        WHERE c.is_deleted = FALSE
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `, [limit, offset], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  getConfessionById: (id) => {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM confessions WHERE id = ? AND is_deleted = FALSE',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  },

  // Vote operations
  castVote: (userId, confessionId, voteType) => {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        // First, check if user already voted
        db.get(
          'SELECT vote_type FROM votes WHERE user_id = ? AND confession_id = ?',
          [userId, confessionId],
          (err, existingVote) => {
            if (err) {
              reject(err);
              return;
            }

            if (existingVote) {
              if (existingVote.vote_type === voteType) {
                // User is removing their vote
                db.run(
                  'DELETE FROM votes WHERE user_id = ? AND confession_id = ?',
                  [userId, confessionId],
                  (err) => {
                    if (err) reject(err);
                    else {
                      // Update confession vote counts
                      const column = voteType === 'upvote' ? 'upvotes' : 'downvotes';
                      db.run(
                        `UPDATE confessions SET ${column} = ${column} - 1 WHERE id = ?`,
                        [confessionId],
                        (err) => {
                          if (err) reject(err);
                          else resolve({ action: 'removed', voteType });
                        }
                      );
                    }
                  }
                );
              } else {
                // User is changing their vote
                db.run(
                  'UPDATE votes SET vote_type = ? WHERE user_id = ? AND confession_id = ?',
                  [voteType, userId, confessionId],
                  (err) => {
                    if (err) reject(err);
                    else {
                      // Update confession vote counts
                      const oldColumn = existingVote.vote_type === 'upvote' ? 'upvotes' : 'downvotes';
                      const newColumn = voteType === 'upvote' ? 'upvotes' : 'downvotes';
                      db.run(
                        `UPDATE confessions SET ${oldColumn} = ${oldColumn} - 1, ${newColumn} = ${newColumn} + 1 WHERE id = ?`,
                        [confessionId],
                        (err) => {
                          if (err) reject(err);
                          else resolve({ action: 'changed', voteType, oldVoteType: existingVote.vote_type });
                        }
                      );
                    }
                  }
                );
              }
            } else {
              // New vote
              db.run(
                'INSERT INTO votes (user_id, confession_id, vote_type) VALUES (?, ?, ?)',
                [userId, confessionId, voteType],
                (err) => {
                  if (err) reject(err);
                  else {
                    // Update confession vote counts
                    const column = voteType === 'upvote' ? 'upvotes' : 'downvotes';
                    db.run(
                      `UPDATE confessions SET ${column} = ${column} + 1 WHERE id = ?`,
                      [confessionId],
                      (err) => {
                        if (err) reject(err);
                        else resolve({ action: 'added', voteType });
                      }
                    );
                  }
                }
              );
            }
          }
        );
      });
    });
  },

  // Comment operations
  createComment: (userId, confessionId, content) => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO comments (confession_id, user_id, content)
        VALUES (?, ?, ?)
      `);
      stmt.run([confessionId, userId, content], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, confessionId, userId, content });
        }
      });
      stmt.finalize();
    });
  },

  getCommentsByConfession: (confessionId) => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT c.*, 
               CASE 
                 WHEN c.user_id = 999999 THEN 'Confessor Bot 🤖'
                 ELSE 'anonymous'
               END as author_handle
        FROM comments c
        WHERE c.confession_id = ? AND c.is_deleted = FALSE
        ORDER BY c.created_at ASC
      `, [confessionId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Flag operations
  flagContent: (userId, contentType, contentId, reason = '') => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO flags (user_id, content_type, content_id, reason)
        VALUES (?, ?, ?, ?)
      `);
      stmt.run([userId, contentType, contentId, reason], function(err) {
        if (err) {
          reject(err);
        } else {
          // Mark content as flagged
          const table = contentType === 'confession' ? 'confessions' : 'comments';
          db.run(
            `UPDATE ${table} SET is_flagged = TRUE WHERE id = ?`,
            [contentId],
            (err) => {
              if (err) reject(err);
              else resolve({ id: this.lastID });
            }
          );
        }
      });
      stmt.finalize();
    });
  },

  // Moderation operations
  getFlaggedContent: () => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 'confession' as type, c.id, c.content, c.created_at, u.handle as author_handle,
               GROUP_CONCAT(f.reason) as flag_reasons
        FROM confessions c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN flags f ON f.content_type = 'confession' AND f.content_id = c.id
        WHERE c.is_flagged = TRUE AND c.is_deleted = FALSE
        GROUP BY c.id
        UNION ALL
        SELECT 'comment' as type, cm.id, cm.content, cm.created_at, u.handle as author_handle,
               GROUP_CONCAT(f.reason) as flag_reasons
        FROM comments cm
        JOIN users u ON cm.user_id = u.id
        LEFT JOIN flags f ON f.content_type = 'comment' AND f.content_id = cm.id
        WHERE cm.is_flagged = TRUE AND cm.is_deleted = FALSE
        GROUP BY cm.id
        ORDER BY created_at DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Data export
  getUserData: (userId) => {
    return new Promise((resolve, reject) => {
      const userData = {};
      
      db.serialize(() => {
        // Get user profile
        db.get(
          'SELECT email, handle, bio, favorite_snack, karma, created_at FROM users WHERE id = ?',
          [userId],
          (err, user) => {
            if (err) {
              reject(err);
              return;
            }
            userData.profile = user;

            // Get user's confessions
            db.all(
              'SELECT content, mood, location, tagged_users, upvotes, downvotes, created_at FROM confessions WHERE user_id = ? AND is_deleted = FALSE',
              [userId],
              (err, confessions) => {
                if (err) {
                  reject(err);
                  return;
                }
                userData.confessions = confessions;

                // Get user's comments
                db.all(
                  'SELECT c.content, c.created_at, conf.content as confession_content FROM comments c JOIN confessions conf ON c.confession_id = conf.id WHERE c.user_id = ? AND c.is_deleted = FALSE',
                  [userId],
                  (err, comments) => {
                    if (err) {
                      reject(err);
                      return;
                    }
                    userData.comments = comments;
                    resolve(userData);
                  }
                );
              }
            );
          }
        );
      });
    });
  }
};

module.exports = { db, initializeDatabase, dbHelpers };