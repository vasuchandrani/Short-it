import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="container animate-fade-in" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '75vh',
      textAlign: 'center',
      paddingTop: '60px',
      paddingBottom: '80px'
    }}>
      {/* Glow Icon */}
      <div style={{
        background: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        padding: '24px',
        borderRadius: '50%',
        color: 'var(--danger)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '32px',
        boxShadow: '0 0 30px 0 rgba(239, 68, 68, 0.15)'
      }}>
        <ShieldAlert size={56} />
      </div>

      <h1 style={{
        fontSize: 'clamp(48px, 8vw, 96px)',
        fontWeight: '800',
        lineHeight: 1,
        marginBottom: '16px',
        fontFamily: 'var(--font-heading)'
      }} className="purple-glow-text">
        404
      </h1>

      <h2 style={{ fontSize: '24px', marginBottom: '16px', color: 'var(--text-primary)' }}>
        Link Not Found / Broken Link
      </h2>

      <p style={{
        fontSize: '16px',
        color: 'var(--text-secondary)',
        maxWidth: '460px',
        lineHeight: 1.6,
        marginBottom: '40px'
      }}>
        The short key you are trying to access does not exist, has expired, or the destination URL was removed by the owner.
      </p>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ padding: '12px 24px' }}>
          <ArrowLeft size={16} />
          <span>Go Back</span>
        </button>
        <button onClick={() => navigate('/')} className="btn btn-primary" style={{ padding: '12px 24px' }}>
          <Home size={16} />
          <span>Return Home</span>
        </button>
      </div>
    </div>
  );
};

export default NotFound;
