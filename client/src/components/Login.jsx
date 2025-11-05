import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate('/');
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
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
        margin: '20px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ 
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            borderRadius: 'var(--radius-lg)',
            margin: '0 auto 20px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'white',
              borderRadius: 'var(--radius)',
              opacity: '0.9'
            }}></div>
          </div>
          <h2 className="page-title" style={{ fontSize: '2rem', marginBottom: '12px' }}>
            Welcome Back
          </h2>
          <p className="page-subtitle" style={{ fontSize: '1.1rem', margin: 0 }}>
            Sign in to your SlotSwapper account
          </p>
        </div>
        
        {error && (
          <div className="notification error" style={{ marginBottom: '24px' }}>
            <div className="notification-content">
              <div className="notification-title">Login Failed</div>
              <div className="notification-message">{error}</div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-control"
              placeholder="Enter your email address"
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
              style={{ padding: '16px' }}
            />
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
                Signing In...
              </div>
            ) : (
              'Sign In to Your Account'
            )}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-light)', marginBottom: '16px' }}>
            Don't have an account yet?
          </p>
          <Link 
            to="/register" 
            className="btn btn-outline btn-lg"
            style={{ width: '100%' }}
          >
            Create New Account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;