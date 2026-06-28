import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Send, UserCheck, AlertCircle, ShieldCheck, Check, Key } from 'lucide-react';

const AuthRequest = () => {
  const { login } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  
  // Verification states for DDU auto-verification
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [code, setCode] = useState('');

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    if (!name || !email || !contact || !password) {
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
        body: JSON.stringify({ name, email: email.trim().toLowerCase(), contact, password })
      });

      const data = await res.json();

      if (res.ok) {
        if (data.requiresVerification) {
          setRequiresVerification(true);
          setVerificationEmail(data.email);
          setMessage(data.message);
        } else {
          setMessage(data.message || 'Your request has been sent successfully.');
          setName('');
          setEmail('');
          setContact('');
          setPassword('');
        }
      } else {
        setError(data.message || 'An error occurred while submitting your request.');
      }
    } catch (err) {
      console.error('Request error:', err);
      setError('Failed to connect to the authentication server. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    if (!code) {
      setError('Please enter the 6-digit verification code.');
      setLoading(false);
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/auth/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: verificationEmail, code })
      });

      const data = await res.json();

      if (res.ok) {
        // Auto-login verified student
        login(data.token, data.user);
        navigate('/dashboard');
      } else {
        setError(data.message || 'Invalid verification code.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Failed to submit verification code.');
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
        
        {/* VIEW A: VERIFICATION OTP CODE FORM */}
        {requiresVerification ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '12px',
                borderRadius: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--success)',
                marginBottom: '16px'
              }}>
                <ShieldCheck size={32} />
              </div>
              <h2 style={{ fontSize: '28px', color: 'var(--text-primary)', marginBottom: '8px' }}>Verify Your Email</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                We sent a 6-digit confirmation code to <strong>{verificationEmail}</strong>.
              </p>
            </div>

            {message && (
              <div className="alert alert-info">
                <ShieldCheck size={18} />
                <span>{message}</span>
              </div>
            )}

            {error && (
              <div className="alert alert-danger">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerifyCode}>
              <div className="form-group" style={{ textAlign: 'center' }}>
                <label className="form-label" style={{ marginBottom: '12px' }}>6-Digit Verification Code</label>
                <input
                  type="text"
                  maxLength="6"
                  className="form-input"
                  placeholder="e.g. 123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  required
                  disabled={loading}
                  style={{
                    fontSize: '24px',
                    letterSpacing: '8px',
                    textAlign: 'center',
                    fontFamily: 'monospace',
                    padding: '10px'
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', marginTop: '12px' }}
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify & Login'}
                {!loading && <Check size={16} />}
              </button>
            </form>

            <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px' }}>
              <button
                onClick={() => setRequiresVerification(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: '500',
                  textDecoration: 'underline'
                }}
              >
                Go Back to Register
              </button>
            </div>
          </div>
        ) : (
          /* VIEW B: STANDARD SIGNUP & ACCESS REQUEST FORM */
          <div>
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
              <h2 style={{ fontSize: '28px', color: 'var(--text-primary)', marginBottom: '8px' }}>Register / Request Access</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Enter your details below. DDU students (<code style={{color: '#a5b4fc'}}>@ddu.ac.in</code>) will be verified and approved automatically!
              </p>
            </div>

            {message && (
              <div className="alert alert-success">
                <Check size={18} style={{ color: 'var(--success)' }} />
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
                  placeholder="e.g. 23ituos013@ddu.ac.in"
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
                  placeholder="e.g. +91 9876543210"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Desired Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Choose a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                {loading ? 'Submitting...' : 'Register & Request Access'}
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
        )}
      </div>
    </div>
  );
};

export default AuthRequest;
