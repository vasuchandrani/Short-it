import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Key, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Get token from URL
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    if (!token) {
      setError('Password reset token is missing. Please request a new link.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, newPassword })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'Your password has been reset successfully.');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(data.message || 'Reset link is invalid or expired.');
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
            <Key size={32} />
          </div>
          <h2 style={{ fontSize: '28px', color: 'var(--text-primary)', marginBottom: '8px' }}>Reset Password</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Set your new account password below.
          </p>
        </div>

        {message && (
          <div>
            <div className="alert alert-success" style={{ marginBottom: '24px' }}>
              <CheckCircle size={18} style={{ color: 'var(--success)' }} />
              <span>{message}</span>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px' }}
            >
              <span>Go to Login</span>
              <ArrowRight size={16} />
            </button>
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
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', marginTop: '12px' }}
              disabled={loading || !token}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
