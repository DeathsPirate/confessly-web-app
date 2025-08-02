import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, MessageCircle, Flag } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

interface Confession {
  id: number;
  content: string;
  mood: string;
  location: string;
  tagged_users: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  author_handle: string;
}

interface Comment {
  id: number;
  content: string;
  author_handle: string;
  created_at: string;
}

interface ConfessionCardProps {
  confession: Confession;
  onVoteUpdate: (confessionId: number, upvotes: number, downvotes: number) => void;
}

const ConfessionCard: React.FC<ConfessionCardProps> = ({ confession, onVoteUpdate }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (showComments && !commentsLoaded) {
      loadComments();
    }
  }, [showComments, commentsLoaded]);

  const loadComments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/confessions/${confession.id}/comments`);
      setComments(response.data.comments);
      setCommentsLoaded(true);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/confessions/${confession.id}/vote`, {
        voteType
      });

      const { confession: updatedConfession } = response.data;
      onVoteUpdate(confession.id, updatedConfession.upvotes, updatedConfession.downvotes);
      
      // Update local vote state
      if (response.data.voteResult.action === 'removed') {
        setUserVote(null);
      } else {
        setUserVote(voteType);
      }
    } catch (error) {
      console.error('Vote failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    try {
      const response = await axios.post(`${API_BASE_URL}/confessions/${confession.id}/comments`, {
        content: newComment.trim()
      });

      setComments([...comments, response.data.comment]);
      setNewComment('');
    } catch (error) {
      console.error('Comment failed:', error);
    }
  };

  const handleFlag = async () => {
    if (!user) return;

    try {
      await axios.post(`${API_BASE_URL}/flag`, {
        contentType: 'confession',
        contentId: confession.id,
        reason: 'User reported content'
      });
      alert('Content flagged for review');
    } catch (error) {
      console.error('Flag failed:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="confession-card">
      <div className="confession-content">
        {confession.content}
      </div>

      <div className="confession-meta">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {confession.mood && (
            <span className="confession-mood">{confession.mood}</span>
          )}
          {confession.location && (
            <span>📍 {confession.location}</span>
          )}
          {confession.tagged_users && (
            <span style={{ color: '#4a5568', fontWeight: '500' }}>
              {confession.tagged_users}
            </span>
          )}
        </div>
        <span>{formatDate(confession.created_at)}</span>
      </div>

      <div className="confession-actions">
        <div className="vote-controls">
          <button
            className={`vote-button ${userVote === 'upvote' ? 'active' : ''}`}
            onClick={() => handleVote('upvote')}
            disabled={!user || loading}
          >
            <ChevronUp size={16} />
            {confession.upvotes}
          </button>
          
          <button
            className={`vote-button ${userVote === 'downvote' ? 'active' : ''}`}
            onClick={() => handleVote('downvote')}
            disabled={!user || loading}
          >
            <ChevronDown size={16} />
            {confession.downvotes}
          </button>
        </div>

        <div className="action-buttons">
          <button
            className="icon-button"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle size={16} />
            Comments
          </button>
          
          {user && (
            <button
              className="icon-button"
              onClick={handleFlag}
              title="Flag content"
            >
              <Flag size={16} />
            </button>
          )}
        </div>
      </div>

      {showComments && (
        <div className="comments-section">
          <div className="comments-list">
            {comments.map(comment => (
              <div key={comment.id} className={`comment ${comment.author_handle.includes('🤖') ? 'ai-comment' : ''}`}>
                <div className="comment-content">{comment.content}</div>
                <div className="comment-meta">
                  {comment.author_handle} • {formatDate(comment.created_at)}
                </div>
              </div>
            ))}
          </div>

          {user && (
            <form onSubmit={handleCommentSubmit} className="comment-form">
              <input
                type="text"
                className="comment-input"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add an anonymous comment..."
                maxLength={300}
              />
              <button 
                type="submit" 
                className="button button-primary"
                disabled={!newComment.trim()}
              >
                Comment
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default ConfessionCard;