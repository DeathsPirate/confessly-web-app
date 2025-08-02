import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    handle: '',
    bio: '',
    favoriteSnack: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.handle.length < 3) {
      setError('Handle must be at least 3 characters');
      return;
    }

    setLoading(true);

    try {
      await register(
        formData.email,
        formData.password,
        formData.handle,
        formData.bio,
        formData.favoriteSnack
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Join Confessly</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            className="form-input"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="handle">Handle (Public Username)</label>
          <input
            type="text"
            id="handle"
            name="handle"
            className="form-input"
            value={formData.handle}
            onChange={handleChange}
            placeholder="e.g., mystery_confessor"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            className="form-input"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            className="form-input"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="bio">Bio (Optional)</label>
          <textarea
            id="bio"
            name="bio"
            className="form-textarea"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Tell us a bit about yourself..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="favoriteSnack">Favorite Snack (Optional)</label>
          <input
            type="text"
            id="favoriteSnack"
            name="favoriteSnack"
            className="form-input"
            value={formData.favoriteSnack}
            onChange={handleChange}
            placeholder="e.g., Chocolate chip cookies"
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button 
          type="submit" 
          className="button button-primary" 
          disabled={loading}
          style={{ width: '100%', marginTop: '1rem' }}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '1rem' }}>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
};

export default Register;