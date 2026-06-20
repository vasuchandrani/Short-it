import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

const Landing = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="container animate-fade-in" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '75vh',
      textAlign: 'center',
      paddingTop: '40px',
      paddingBottom: '80px'
    }}>
      {/* Feature Tag */}
      <div style={{
        background: 'rgba(99, 102, 241, 0.08)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        padding: '6px 16px',
        borderRadius: '99px',
        fontSize: '13px',
        fontWeight: '600',
        color: '#a5b4fc',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '24px',
        boxShadow: 'inset 0 0 12px rgba(99, 102, 241, 0.1)'
      }}>
        <Sparkles size={14} style={{ color: 'var(--secondary)' }} />
        <span>Private & Invite-Only Link Management</span>
      </div>

      {/* Hero Section */}
      <h1 style={{
        fontSize: 'clamp(36px, 6vw, 68px)',
        lineHeight: 1.15,
        maxWidth: '850px',
        marginBottom: '20px',
        fontWeight: '800',
        letterSpacing: '-2px'
      }}>
        Shorten, Brand & Track Your <br />
        Links on <span className="gradient-text">Short-It</span>
      </h1>

      {/* Short Description */}
      <p style={{
        fontSize: 'clamp(16px, 2.5vw, 19px)',
        color: 'var(--text-secondary)',
        maxWidth: '580px',
        lineHeight: 1.6,
        marginBottom: '40px',
        fontWeight: '400'
      }}>
        A secure, private link-shortening service crafted exclusively for trusted circles. Create custom links, access analytical cache boosts, and manage your assets with ease.
      </p>

      {/* Two Buttons */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '16px',
        width: '100%',
        maxWidth: '450px'
      }}>
        <Link to="/auth-request" className="btn btn-secondary" style={{
          flex: '1 1 200px',
          padding: '16px 28px',
          fontSize: '16px',
          borderRadius: '14px',
          boxShadow: 'none'
        }}>
          <ShieldCheck size={18} style={{ color: 'var(--secondary)' }} />
          <span>Authenticate</span>
        </Link>
        <Link to={user ? "/dashboard" : "/login"} className="btn btn-primary" style={{
          flex: '1 1 200px',
          padding: '16px 28px',
          fontSize: '16px',
          borderRadius: '14px'
        }}>
          <span>Dashboard</span>
          <ArrowRight size={18} />
        </Link>
      </div>

      {/* Trust Indicator / Extra Details */}
      <div style={{
        marginTop: '60px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        fontSize: '13px',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--success)' }}></div>
          <span>Neon Postgres DB</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--secondary)' }}></div>
          <span>Upstash Redis Caching</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent)' }}></div>
          <span>JWT Protected</span>
        </div>
      </div>
    </div>
  );
};

export default Landing;
