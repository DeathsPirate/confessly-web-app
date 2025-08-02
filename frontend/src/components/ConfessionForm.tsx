import React, { useState } from 'react';
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

interface ConfessionFormProps {
  onConfessionCreated: (confession: Confession) => void;
}

const ConfessionForm: React.FC<ConfessionFormProps> = ({ onConfessionCreated }) => {
  const [formData, setFormData] = useState({
    content: '',
    mood: '',
    location: '',
    taggedUsers: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();

  const moods = [
    'Guilty', 'Regretful', 'Hopeful', 'Anxious', 'Frustrated', 
    'Embarrassed', 'Relieved', 'Confused', 'Proud', 'Ashamed'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.content.trim()) {
      setError('Please enter your confession');
      return;
    }

    if (formData.content.length > 500) {
      setError('Confession must be 500 characters or less');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/confessions`, {
        content: formData.content.trim(),
        mood: formData.mood,
        location: formData.location,
        taggedUsers: formData.taggedUsers
      });

      const newConfession = {
        ...response.data.confession,
        author_handle: 'anonymous'
      };

      onConfessionCreated(newConfession);
      setFormData({ content: '', mood: '', location: '', taggedUsers: '' });
      setSuccess('Confession posted anonymously!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to post confession');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="confession-card" style={{ marginBottom: '2rem' }}>
      <h3>Share Your Confession</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="content">Your Confession</label>
          <textarea
            id="content"
            name="content"
            className="form-textarea"
            value={formData.content}
            onChange={handleChange}
            placeholder="What's on your mind? Your confession will be posted anonymously..."
            maxLength={500}
            rows={4}
            required
          />
          <div style={{ fontSize: '0.8rem', color: '#666', textAlign: 'right' }}>
            {formData.content.length}/500 characters
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="mood">Mood (Optional)</label>
            <select
              id="mood"
              name="mood"
              className="form-input"
              value={formData.mood}
              onChange={handleChange}
            >
              <option value="">Select a mood...</option>
              {moods.map(mood => (
                <option key={mood} value={mood}>{mood}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="location">Location (Optional)</label>
            <input
              type="text"
              id="location"
              name="location"
              className="form-input"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Home, Work, Coffee shop..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="taggedUsers">Tag Users (Optional)</label>
            <input
              type="text"
              id="taggedUsers"
              name="taggedUsers"
              className="form-input"
              value={formData.taggedUsers}
              onChange={handleChange}
              placeholder="e.g., @friends @family"
            />
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <button 
          type="submit" 
          className="button button-primary" 
          disabled={loading}
          style={{ marginTop: '1rem' }}
        >
          {loading ? 'Posting...' : 'Post Confession Anonymously'}
        </button>
      </form>
    </div>
  );
};

export default ConfessionForm;