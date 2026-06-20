import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Link2, Sparkles, Copy, Check, AlertCircle, ArrowRight, User } from 'lucide-react';

const Dashboard = () => {
  const { token, user } = useContext(AuthContext);
  const [originalUrl, setOriginalUrl] = useState('');
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successResult, setSuccessResult] = useState(null);
  const [copied, setCopied] = useState(false);
  
  const navigate = useNavigate();

  // Redirect if not authenticated
  if (!token) {
    navigate('/login');
    return null;
  }

  const handleShorten = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessResult(null);
    setCopied(false);
    setLoading(true);

    if (!originalUrl || !key) {
      setError('Please fill in both the original URL and your custom key.');
      setLoading(false);
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/urls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ originalUrl, key })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessResult(data);
        setOriginalUrl('');
        setKey('');
      } else {
        // Validation messages are passed back here
        setError(data.message || 'An error occurred during URL shortening.');
      }
    } catch (err) {
      console.error('Shorten error:', err);
      setError('Failed to contact the server.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Theoretical production URL
  const getProdUrl = (k) => `https://ddu-projects.com/${k}`;

  return (
    <div className="container animate-fade-in" style={{
      maxWidth: '750px',
      paddingTop: '40px',
      paddingBottom: '80px'
    }}>
      {/* Welcome Header */}
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '32px', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Welcome back, <span className="gradient-text">{user?.name || 'User'}</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Create custom, cached, high-speed redirect short links instantly.
        </p>
      </div>

      {/* Main Shortener Form */}
      <div className="glass-panel" style={{ padding: '40px', borderRadius: '24px', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <Sparkles style={{ color: 'var(--secondary)' }} size={20} />
          <h3 style={{ fontSize: '20px', fontWeight: '600' }}>Shorten a New URL</h3>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleShorten}>
          <div className="form-group">
            <label className="form-label">Original Destination URL</label>
            <input
              type="url"
              className="form-input"
              placeholder="e.g. https://myportfolio.com/projects/xyz"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Custom Keyword / Short Key</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '15px', fontWeight: '500' }}>ddu-projects.com /</span>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. portfolio"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                required
                disabled={loading}
                style={{ flex: 1 }}
              />
            </div>
            <span style={{ display: 'block', marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Letters, numbers, dashes, and underscores only.
            </span>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', marginTop: '16px' }}
            disabled={loading}
          >
            {loading ? 'Generating Link...' : 'Create Short Link'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>
      </div>

      {/* Success Modal / Box */}
      {successResult && (
        <div className="glass-panel" style={{
          padding: '30px',
          borderRadius: '24px',
          borderLeft: '4px solid var(--success)',
          animation: 'fadeIn 0.4s ease forwards',
          marginBottom: '40px'
        }}>
          <h4 style={{ color: '#a7f3d0', fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={18} style={{ color: 'var(--success)' }} />
            Link Generated Successfully!
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Theoretical Production Link */}
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Production URL (Assumed)</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="text"
                  className="form-input"
                  readOnly
                  value={getProdUrl(successResult.key)}
                  style={{ background: 'rgba(255, 255, 255, 0.02)', cursor: 'default' }}
                />
                <button
                  onClick={() => copyToClipboard(getProdUrl(successResult.key))}
                  className="btn btn-secondary"
                  style={{ padding: '12px' }}
                  title="Copy Production Link"
                >
                  {copied ? <Check size={16} style={{ color: 'var(--success)' }} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            {/* Local / Development Redirect link */}
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Local Server Link (For Testing)</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="text"
                  className="form-input"
                  readOnly
                  value={successResult.shortUrl}
                  style={{ background: 'rgba(255, 255, 255, 0.02)', cursor: 'default', color: 'var(--text-secondary)' }}
                />
                <a
                  href={successResult.shortUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ padding: '12px', textDecoration: 'none' }}
                  title="Test Redirect"
                >
                  <Link2 size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile quick access */}
      <div style={{ textAlign: 'center' }}>
        <Link to="/profile" className="btn btn-secondary" style={{ padding: '12px 30px' }}>
          <User size={16} />
          <span>View All My Links in Profile</span>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
