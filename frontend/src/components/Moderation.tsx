import React, { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, Bot } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

interface FlaggedContent {
  id: number;
  type: 'confession' | 'comment';
  content: string;
  author_handle: string;
  created_at: string;
  flag_reasons: string;
}

const Moderation: React.FC = () => {
  const { user } = useAuth();
  const [flaggedContent, setFlaggedContent] = useState<FlaggedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiProcessing, setAiProcessing] = useState(false);

  useEffect(() => {
    if (user && user.karma >= 100) {
      fetchFlaggedContent();
    }
  }, [user]);

  const fetchFlaggedContent = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/moderation/flagged`);
      setFlaggedContent(response.data.flaggedContent);
    } catch (err: any) {
      setError('Failed to load flagged content');
      console.error('Error fetching flagged content:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (contentType: string, contentId: number) => {
    if (!window.confirm(`Are you sure you want to delete this ${contentType}?`)) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/moderation/${contentType}/${contentId}`);
      
      // Remove from local state
      setFlaggedContent(flaggedContent.filter(item => 
        !(item.type === contentType && item.id === contentId)
      ));
      
      alert(`${contentType} deleted successfully`);
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete content');
    }
  };

  const handleAiProcessAll = async () => {
    if (!window.confirm('Trigger AI assistant to review and respond to recent confessions?')) {
      return;
    }

    setAiProcessing(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/ai/process-all`);
      alert(`${response.data.message}`);
    } catch (error) {
      console.error('AI processing failed:', error);
      alert('Failed to trigger AI processing');
    } finally {
      setAiProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!user || user.karma < 100) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2>Access Denied</h2>
        <p>You need 100+ karma to access moderation tools.</p>
        <p>Current karma: {user?.karma || 0}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Loading moderation queue...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem' 
      }}>
        <h1>Moderation Queue</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={handleAiProcessAll}
            disabled={aiProcessing}
            className="button button-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Bot size={16} />
            {aiProcessing ? 'AI Processing...' : 'Trigger AI Assistant'}
          </button>
          <div className="moderator-badge">
            MODERATOR ({user.karma} karma)
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div style={{ 
        background: '#fff3cd', 
        border: '1px solid #ffeaa7', 
        padding: '1rem', 
        borderRadius: '4px',
        marginBottom: '2rem'
      }}>
        <strong>Moderator Guidelines:</strong>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
          <li>Review flagged content carefully</li>
          <li>Delete content that violates community standards</li>
          <li>Consider the context before taking action</li>
          <li>Use your powers responsibly</li>
        </ul>
      </div>

      {flaggedContent.length === 0 ? (
        <div style={{ 
          background: 'white', 
          padding: '2rem', 
          borderRadius: '8px', 
          textAlign: 'center' 
        }}>
          <AlertTriangle size={48} style={{ color: '#38a169', marginBottom: '1rem' }} />
          <h3>No Flagged Content</h3>
          <p>The moderation queue is empty. Great job keeping the community clean!</p>
        </div>
      ) : (
        <div className="moderation-queue">
          {flaggedContent.map(item => (
            <div key={`${item.type}-${item.id}`} className="flagged-content">
              <div className="flagged-header">
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span className="content-type-badge">
                    {item.type.toUpperCase()}
                  </span>
                  <span>by @{item.author_handle}</span>
                  <span style={{ color: '#666', fontSize: '0.9rem' }}>
                    {formatDate(item.created_at)}
                  </span>
                </div>
                
                <button
                  onClick={() => handleDelete(item.type, item.id)}
                  className="button button-danger"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>

              <div style={{ 
                background: '#f7fafc', 
                padding: '1rem', 
                borderRadius: '4px', 
                margin: '1rem 0',
                borderLeft: '3px solid #e2e8f0'
              }}>
                <strong>Content:</strong>
                <p style={{ marginTop: '0.5rem' }}>{item.content}</p>
              </div>

              {item.flag_reasons && (
                <div className="flag-reasons">
                  <strong>Flag Reasons:</strong> {item.flag_reasons}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Moderation;