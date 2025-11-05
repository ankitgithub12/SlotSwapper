import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData.name, formData.email, formData.password);
      navigate('/');
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '80vh',
      padding: '20px'
    }}>
      <div className="card" style={{ 
        width: '100%', 
        maxWidth: '440px',
        padding: '40px',
        margin: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated background elements */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '100px',
          height: '100px',
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          borderRadius: '50%',
          opacity: '0.1'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '-30px',
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, var(--accent), var(--primary))',
          borderRadius: '50%',
          opacity: '0.1'
        }}></div>
        
        <div style={{ textAlign: 'center', marginBottom: '40px', position: 'relative' }}>
          <div style={{ 
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            borderRadius: 'var(--radius-lg)',
            margin: '0 auto 20px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'white',
              borderRadius: 'var(--radius)',
              opacity: '0.9',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '20px',
                height: '2px',
                background: 'var(--primary)',
                borderRadius: '1px'
              }}></div>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(90deg)',
                width: '20px',
                height: '2px',
                background: 'var(--primary)',
                borderRadius: '1px'
              }}></div>
            </div>
          </div>
          <h2 className="page-title" style={{ fontSize: '2rem', marginBottom: '12px' }}>
            Create Account
          </h2>
          <p className="page-subtitle" style={{ fontSize: '1.1rem', margin: 0 }}>
            Join SlotSwapper and start swapping time slots
          </p>
        </div>
        
        {error && (
          <div className="notification error" style={{ marginBottom: '24px' }}>
            <div className="notification-content">
              <div className="notification-title">Registration Failed</div>
              <div className="notification-message">{error}</div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-control"
              placeholder="Enter your full name"
              required
              style={{ padding: '16px' }}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-control"
              placeholder="Enter your email"
              required
              style={{ padding: '16px' }}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-control"
              placeholder="Enter your password"
              required
              minLength="6"
              style={{ padding: '16px' }}
            />
            <div className="form-text">
              Password must be at least 6 characters long
            </div>
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary btn-lg" 
            disabled={loading} 
            style={{ width: '100%', marginBottom: '24px' }}
          >
            {loading ? (
              <div className="d-flex align-center justify-center gap-2">
                <div className="spinner"></div>
                Creating Account...
              </div>
            ) : (
              'Create Your Account'
            )}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-light)', marginBottom: '16px' }}>
            Already have an account?
          </p>
          <Link 
            to="/login" 
            className="btn btn-outline btn-lg"
            style={{ width: '100%' }}
          >
            Sign In Instead
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;