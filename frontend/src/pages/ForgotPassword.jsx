import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    if (!email) {
      setError('Please provide your email.');
      setLoading(false);
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'If registered, a password reset link has been sent.');
      } else {
        setError(data.message || 'An error occurred. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to connect to the authentication server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{
      maxWidth: '480px',
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
            <Mail size={32} />
          </div>
          <h2 style={{ fontSize: '28px', color: 'var(--text-primary)', marginBottom: '8px' }}>Forgot Password</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            We'll email you a secure link to reset your account password.
          </p>
        </div>

        {message && (
          <div className="alert alert-success">
            <CheckCircle size={18} style={{ color: 'var(--success)' }} />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {!message && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="e.g. student@ddu.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px' }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'underline'
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
