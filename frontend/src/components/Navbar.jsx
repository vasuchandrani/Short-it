import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Link2, LogOut, LayoutDashboard, User, ShieldAlert } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="glass-panel navbar">
      <Link to="/" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        textDecoration: 'none',
        color: 'var(--text-primary)',
        fontSize: '22px',
        fontWeight: '800',
        letterSpacing: '-0.5px',
        flexShrink: 0
      }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
          padding: '6px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 10px 0 rgba(99, 102, 241, 0.3)'
        }}>
          <Link2 size={20} style={{ color: 'white' }} />
        </div>
        <span>Short-<span className="gradient-text">It</span></span>
      </Link>

      <div className="navbar-actions">
        {user ? (
          <>
            <Link to="/dashboard" className="btn btn-secondary" style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: isActive('/dashboard') ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              borderColor: isActive('/dashboard') ? 'var(--primary)' : 'var(--border-color)',
            }}>
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </Link>

            <Link to="/profile" className="btn btn-secondary" style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: isActive('/profile') ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              borderColor: isActive('/profile') ? 'var(--primary)' : 'var(--border-color)',
            }}>
              <User size={16} />
              <span>Profile</span>
            </Link>

            {user.role === 'admin' && (
              <Link to="/admin" className="btn btn-secondary" style={{
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: isActive('/admin') ? 'rgba(217, 70, 239, 0.15)' : 'transparent',
                borderColor: isActive('/admin') ? 'var(--accent)' : 'var(--border-color)',
              }}>
                <ShieldAlert size={16} style={{ color: 'var(--accent)' }} />
                <span style={{ color: isActive('/admin') ? 'white' : 'var(--text-primary)' }}>Admin</span>
              </Link>
            )}

            <button onClick={handleLogout} className="btn btn-danger" style={{
              padding: '8px 16px',
              fontSize: '14px',
            }}>
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-secondary" style={{
              padding: '8px 20px',
              fontSize: '14px'
            }}>
              Log In
            </Link>
            <Link to="/auth-request" className="btn btn-primary" style={{
              padding: '8px 20px',
              fontSize: '14px'
            }}>
              Request Access
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
