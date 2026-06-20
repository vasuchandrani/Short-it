import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, UserCheck, AlertCircle } from 'lucide-react';

const AuthRequest = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    if (!name || !email || !contact) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/auth/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, contact })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || 'Your request has been sent successfully.');
        setName('');
        setEmail('');
        setContact('');
      } else {
        // If request is already in process or blocked, display message
        setError(data.message || 'An error occurred while submitting your request.');
      }
    } catch (err) {
      console.error('Request error:', err);
      setError('Failed to connect to the authentication server. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{
      maxWidth: '520px',
      paddingTop: '60px',
      paddingBottom: '80px'
    }}>
      <div className="glass-panel" style={{ padding: '40px', borderRadius: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            background: 'rgba(99, 102, 241, 0.1)',
            padding: '12px',
            borderRadius: '14px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            marginBottom: '16px'
          }}>
            <UserCheck size={32} />
          </div>
          <h2 style={{ fontSize: '28px', color: 'var(--text-primary)', marginBottom: '8px' }}>Request Access</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Short-It is a private platform. Fill out the request below to seek administrator approval.
          </p>
        </div>

        {message && (
          <div className="alert alert-success">
            <UserCheck size={18} />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contact Number</label>
            <input
              type="tel"
              className="form-input"
              placeholder="e.g. +1 555-0199"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', marginTop: '12px' }}
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Send Authentication Request'}
            {!loading && <Send size={16} />}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Already approved? </span>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              cursor: 'pointer',
              fontWeight: '600',
              textDecoration: 'underline'
            }}
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthRequest;
