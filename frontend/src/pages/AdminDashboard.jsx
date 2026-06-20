import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { ShieldCheck, UserX, Users, Clock, Trash2, ShieldX, Unlock, RefreshCw, AlertCircle } from 'lucide-react';

const AdminDashboard = () => {
  const { token, user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('requests'); // requests, users, blocked
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if not admin
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [token, user, navigate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const reqHeaders = { 'Authorization': `Bearer ${token}` };

      const [requestsRes, usersRes, blockedRes] = await Promise.all([
        fetch(`${baseUrl}/api/admin/requests`, { headers: reqHeaders }),
        fetch(`${baseUrl}/api/admin/users`, { headers: reqHeaders }),
        fetch(`${baseUrl}/api/admin/blocked`, { headers: reqHeaders })
      ]);

      if (requestsRes.ok && usersRes.ok && blockedRes.ok) {
        const [requestsData, usersData, blockedData] = await Promise.all([
          requestsRes.json(),
          usersRes.json(),
          blockedRes.json()
        ]);
        setRequests(requestsData);
        setUsers(usersData);
        setBlocked(blockedData);
      } else {
        setError('Failed to fetch admin data.');
      }
    } catch (err) {
      console.error('Fetch admin data error:', err);
      setError('Connection to server failed.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token && user?.role === 'admin') {
      fetchData();
    }
  }, [token, user, fetchData]);

  const handleApprove = async (id) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/admin/requests/${id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchData();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to approve request.');
      }
    } catch (err) {
      console.error('Approve error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/admin/requests/${id}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchData();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to reject request.');
      }
    } catch (err) {
      console.error('Reject error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveUser = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove user "${name}"? This will permanently delete their account and all short URLs they created.`)) {
      return;
    }
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchData();
      } else {
        alert('Failed to remove user.');
      }
    } catch (err) {
      console.error('Remove user error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblock = async (email) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/admin/blocked/${email}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchData();
      } else {
        alert('Failed to unblock user.');
      }
    } catch (err) {
      console.error('Unblock error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{
      paddingTop: '40px',
      paddingBottom: '80px'
    }}>
      {/* Admin Title & Sync */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '40px'
      }}>
        <div>
          <h2 style={{ fontSize: '32px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck style={{ color: 'var(--accent)' }} size={32} />
            <span>Super Admin <span className="gradient-text">Console</span></span>
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>Manage access invites, block lists, and active user directories.</p>
        </div>
        <button onClick={fetchData} className="btn btn-secondary" style={{ padding: '10px' }} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '30px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Counter Panels */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        {/* Stat 1 */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '12px', borderRadius: '12px', color: 'var(--primary)' }}>
            <Clock size={24} />
          </div>
          <div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Pending Requests</p>
            <h4 style={{ fontSize: '24px', fontWeight: '800' }}>{requests.length}</h4>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '12px', color: 'var(--success)' }}>
            <Users size={24} />
          </div>
          <div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Approved Users</p>
            <h4 style={{ fontSize: '24px', fontWeight: '800' }}>{users.length}</h4>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '12px', color: 'var(--danger)' }}>
            <ShieldX size={24} />
          </div>
          <div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Blocked Users</p>
            <h4 style={{ fontSize: '24px', fontWeight: '800' }}>{blocked.length}</h4>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '24px',
        gap: '8px'
      }}>
        <button
          onClick={() => setActiveTab('requests')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'requests' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'requests' ? 'var(--text-primary)' : 'var(--text-secondary)',
            padding: '12px 24px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'var(--transition-all)'
          }}
        >
          Pending Requests ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'users' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'users' ? 'var(--text-primary)' : 'var(--text-secondary)',
            padding: '12px 24px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'var(--transition-all)'
          }}
        >
          Approved Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('blocked')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'blocked' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'blocked' ? 'var(--text-primary)' : 'var(--text-secondary)',
            padding: '12px 24px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'var(--transition-all)'
          }}
        >
          Blocked Users ({blocked.length})
        </button>
      </div>

      {/* Tab Panels */}
      <div className="glass-panel" style={{ padding: '30px', borderRadius: '24px' }}>
        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading directory info...</p>
        ) : activeTab === 'requests' ? (
          /* PENDING REQUESTS PANEL */
          requests.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px 0' }}>No pending authentication requests found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    <th style={{ padding: '12px 8px' }}>User Details</th>
                    <th style={{ padding: '12px 8px' }}>Contact Number</th>
                    <th style={{ padding: '12px 8px' }}>Submission Date</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '14px' }}>
                      <td style={{ padding: '16px 8px' }}>
                        <p style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{req.name}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{req.email}</p>
                      </td>
                      <td style={{ padding: '16px 8px', color: 'var(--text-secondary)' }}>{req.contact}</td>
                      <td style={{ padding: '16px 8px', color: 'var(--text-muted)' }}>
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => handleApprove(req.id)}
                            className="btn btn-primary"
                            style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '6px' }}
                            disabled={actionLoading}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '6px', color: '#fca5a5' }}
                            disabled={actionLoading}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : activeTab === 'users' ? (
          /* APPROVED USERS PANEL */
          users.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px 0' }}>No active users directories found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    <th style={{ padding: '12px 8px' }}>Name / Email</th>
                    <th style={{ padding: '12px 8px' }}>Contact</th>
                    <th style={{ padding: '12px 8px' }}>Join Date</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '14px' }}>
                      <td style={{ padding: '16px 8px' }}>
                        <p style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{u.name}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.email}</p>
                      </td>
                      <td style={{ padding: '16px 8px', color: 'var(--text-secondary)' }}>{u.contact}</td>
                      <td style={{ padding: '16px 8px', color: 'var(--text-muted)' }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleRemoveUser(u.id, u.name)}
                          className="btn btn-secondary"
                          style={{ padding: '8px', color: '#fca5a5', border: 'none' }}
                          title="Delete user"
                          disabled={actionLoading}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* BLOCKED USERS PANEL */
          blocked.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px 0' }}>No users currently blocked.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    <th style={{ padding: '12px 8px' }}>Name / Email</th>
                    <th style={{ padding: '12px 8px' }}>Contact</th>
                    <th style={{ padding: '12px 8px' }}>Blocked Since</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Unblock</th>
                  </tr>
                </thead>
                <tbody>
                  {blocked.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '14px' }}>
                      <td style={{ padding: '16px 8px' }}>
                        <p style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{b.name}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{b.email}</p>
                      </td>
                      <td style={{ padding: '16px 8px', color: 'var(--text-secondary)' }}>{b.contact}</td>
                      <td style={{ padding: '16px 8px', color: 'var(--text-muted)' }}>
                        {new Date(b.blocked_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleUnblock(b.email)}
                          className="btn btn-secondary"
                          style={{
                            padding: '6px 12px',
                            fontSize: '13px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            borderRadius: '6px',
                            borderColor: 'rgba(16, 185, 129, 0.3)',
                            color: '#a7f3d0'
                          }}
                          disabled={actionLoading}
                        >
                          <Unlock size={14} />
                          <span>Unblock</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
