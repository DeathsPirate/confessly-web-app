import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ConfessionForm from './ConfessionForm';
import ConfessionCard from './ConfessionCard';
import axios from 'axios';

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

const Home: React.FC = () => {
  const { user } = useAuth();
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConfessions();
  }, []);

  const fetchConfessions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/confessions`);
      setConfessions(response.data.confessions);
    } catch (err: any) {
      setError('Failed to load confessions');
      console.error('Error fetching confessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewConfession = (newConfession: Confession) => {
    setConfessions([newConfession, ...confessions]);
  };

  const handleVoteUpdate = (confessionId: number, upvotes: number, downvotes: number) => {
    setConfessions(confessions.map(confession => 
      confession.id === confessionId 
        ? { ...confession, upvotes, downvotes }
        : confession
    ));
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Loading confessions...</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Anonymous Confessions</h1>
      
      {user ? (
        <ConfessionForm onConfessionCreated={handleNewConfession} />
      ) : (
        <div style={{ 
          background: 'white', 
          padding: '2rem', 
          borderRadius: '8px', 
          marginBottom: '2rem',
          textAlign: 'center' 
        }}>
          <h3>Welcome to Confessly</h3>
          <p>Share your anonymous confessions and connect with others through authentic stories.</p>
          <p><a href="/login">Login</a> or <a href="/register">register</a> to start confessing!</p>
        </div>
      )}

      {error && (
        <div className="error-message" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div className="confession-feed">
        {confessions.length === 0 ? (
          <div style={{ 
            background: 'white', 
            padding: '2rem', 
            borderRadius: '8px', 
            textAlign: 'center' 
          }}>
            <p>No confessions yet. Be the first to share!</p>
          </div>
        ) : (
          confessions.map(confession => (
            <ConfessionCard
              key={confession.id}
              confession={confession}
              onVoteUpdate={handleVoteUpdate}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Home;