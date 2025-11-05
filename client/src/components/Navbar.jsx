// Navbar.jsx - CORRECTED VERSION
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Navbar({ theme, toggleTheme }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userMenuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Dashboard', type: 'dashboard' },
    { path: '/marketplace', label: 'Marketplace', type: 'marketplace' },
    { path: '/notifications', label: 'Notifications', type: 'notifications' },
    { path: '/trash', label: 'Trash', type: 'trash' }
  ];
  
  if (user?.isAdmin) {
    navItems.push({ path: '/admin/trash', label: 'Admin', type: 'admin' });
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand" onClick={() => setMobileMenuOpen(false)}>
          <div className="brand-logo"></div>
          <span>SlotSwapper</span>
        </Link>
        
        <button 
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        />

        {user && (
          <ul className={`navbar-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            {navItems.map(item => (
              <li key={item.path} className="nav-item">
                <Link 
                  to={item.path} 
                  className={`nav-link ${item.type} ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
            
            <li className="d-flex align-center gap-2">
              <button 
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label="Toggle theme"
              />
              
              <div className="user-menu" ref={userMenuRef}>
                <button 
                  className="user-trigger"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                >
                  <div className="user-avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ 
                    color: 'var(--text)', 
                    fontWeight: '500'
                  }}>
                    {user.name}
                  </span>
                </button>
                
                <div className={`user-dropdown ${userDropdownOpen ? 'open' : ''}`}>
                  <div className="user-info">
                    <div className="user-name">{user.name}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                  <div className="user-actions">
                    <button 
                      className="user-action-btn logout"
                      onClick={handleLogout}
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        )}
      </div>
    </nav>
  );
}

export default Navbar;