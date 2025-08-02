import React, { useState } from 'react';
import { Download } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);

  if (!user) {
    return <div>Please log in to view your profile.</div>;
  }

  const handleDataExport = async () => {
    setDownloading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/user/export`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `confessly-data-${user.handle}-${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const joinDate = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div>
      <h1>Your Profile</h1>
      
      <div className="profile-section">
        <div className="profile-header">
          <h2>@{user.handle}</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span className="karma-badge">{user.karma} karma</span>
            {user.karma >= 100 && (
              <span className="moderator-badge">MODERATOR</span>
            )}
          </div>
        </div>

        <div className="profile-stats">
          <div className="stat-card">
            <div className="stat-value">{user.karma}</div>
            <div className="stat-label">Total Karma</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {user.karma >= 100 ? 'Yes' : 'No'}
            </div>
            <div className="stat-label">Moderator Status</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{joinDate}</div>
            <div className="stat-label">Member Since</div>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3>Personal Information</h3>
          <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <strong>Email:</strong> {user.email}
            </div>
            <div>
              <strong>Bio:</strong> {user.bio || 'No bio provided'}
            </div>
            <div>
              <strong>Favorite Snack:</strong> {user.favorite_snack || 'Not specified'}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3>About Karma</h3>
          <p style={{ color: '#666', lineHeight: '1.6' }}>
            Karma is earned when other users upvote your confessions. Each upvote gives you +1 karma, 
            and each downvote removes -1 karma. Reach 100 karma to unlock moderator privileges!
          </p>
          {user.karma >= 100 && (
            <div style={{ 
              background: '#fff3cd', 
              border: '1px solid #ffeaa7', 
              padding: '1rem', 
              borderRadius: '4px',
              marginTop: '1rem'
            }}>
              <strong>🎉 Congratulations!</strong> You have moderator privileges. You can now review 
              flagged content and help maintain the community.
            </div>
          )}
        </div>

        <div>
          <h3>Data Export</h3>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            Download all your data including confessions, comments, and profile information.
          </p>
          <button
            onClick={handleDataExport}
            disabled={downloading}
            className="button button-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Download size={16} />
            {downloading ? 'Preparing Download...' : 'Download My Data'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;