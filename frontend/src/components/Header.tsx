import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          Confessly
        </Link>
        
        <nav>
          <ul className="nav-links">
            <li><Link to="/">Home</Link></li>
            {user ? (
              <>
                <li><Link to="/profile">Profile</Link></li>
                {user.karma >= 100 && (
                  <li><Link to="/moderation">Moderation</Link></li>
                )}
                <li>
                  <button 
                    onClick={handleLogout}
                    className="button button-secondary"
                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.9rem' }}
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li><Link to="/login">Login</Link></li>
                <li><Link to="/register">Register</Link></li>
              </>
            )}
          </ul>
        </nav>

        {user && (
          <div className="user-info">
            <span>@{user.handle}</span>
            <span className="karma-badge">{user.karma} karma</span>
            {user.karma >= 100 && (
              <span className="moderator-badge">MOD</span>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;