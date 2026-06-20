import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { User, Calendar, ExternalLink, Copy, Check, Link2, AlertCircle } from 'lucide-react';

const Profile = () => {
  const { token, user } = useContext(AuthContext);
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copyStates, setCopyStates] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchUrls();
  }, [token, navigate]);

  const fetchUrls = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/urls`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUrls(data);
      } else {
        setError('Failed to fetch short links.');
      }
    } catch (err) {
      console.error('Fetch URLs error:', err);
      setError('Connection to server failed.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopyStates(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopyStates(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const formatDate = (dateStr) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  // Theoretical production URL
  const getProdUrl = (key) => `https://ddu-projects.com/${key}`;

  return (
    <div className="container animate-fade-in" style={{
      paddingTop: '40px',
      paddingBottom: '80px'
    }}>
      {/* Profile Overview */}
      <div className="glass-panel" style={{
        padding: '30px 40px',
        borderRadius: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        marginBottom: '40px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
          padding: '16px',
          borderRadius: '50%',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.4)'
        }}>
          <User size={36} />
        </div>
        <div>
          <h2 style={{ fontSize: '26px', color: 'var(--text-primary)', marginBottom: '4px' }}>{user?.name}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Email: <strong>{user?.email}</strong></span>
            <span style={{ color: 'var(--text-muted)' }}>|</span>
            <span>Contact: <strong>{user?.contact}</strong></span>
          </p>
        </div>
      </div>

      {/* URL List */}
      <div className="glass-panel" style={{ padding: '30px', borderRadius: '24px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>My Shortened URLs</h3>

        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading links...</p>
        ) : error ? (
          <div className="alert alert-danger">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        ) : urls.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            <Link2 size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
            <p style={{ fontSize: '16px', marginBottom: '16px' }}>You haven't shortened any URLs yet.</p>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
              Shorten Your First Link
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  <th style={{ padding: '12px 8px', fontWeight: '600' }}>Short URL</th>
                  <th style={{ padding: '12px 8px', fontWeight: '600' }}>Key</th>
                  <th style={{ padding: '12px 8px', fontWeight: '600' }}>Original Destination</th>
                  <th style={{ padding: '12px 8px', fontWeight: '600' }}>Created Date</th>
                  <th style={{ padding: '12px 8px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {urls.map((url) => {
                  const prodLink = getProdUrl(url.key);
                  return (
                    <tr key={url.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '14px' }}>
                      {/* Short Link */}
                      <td style={{ padding: '16px 8px', fontWeight: '600', color: '#818cf8' }}>
                        {prodLink}
                      </td>
                      {/* Key */}
                      <td style={{ padding: '16px 8px' }}>
                        <code style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '3px 8px', borderRadius: '4px' }}>
                          {url.key}
                        </code>
                      </td>
                      {/* Original URL */}
                      <td style={{ padding: '16px 8px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <a
                          href={url.original_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                          title={url.original_url}
                        >
                          {url.original_url}
                        </a>
                      </td>
                      {/* Created Date */}
                      <td style={{ padding: '16px 8px', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={13} />
                          <span>{formatDate(url.created_at)}</span>
                        </div>
                      </td>
                      {/* Actions */}
                      <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {/* Copy Link Button */}
                          <button
                            onClick={() => copyToClipboard(url.id, prodLink)}
                            className="btn btn-secondary"
                            style={{ padding: '8px', borderRadius: '6px' }}
                            title="Copy link"
                          >
                            {copyStates[url.id] ? (
                              <Check size={14} style={{ color: 'var(--success)' }} />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                          {/* Test Link Button */}
                          <a
                            href={url.shortUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary"
                            style={{ padding: '8px', borderRadius: '6px' }}
                            title="Test redirect"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
