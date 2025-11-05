// App.jsx - CORRECTED VERSION
import React, { useState, useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Marketplace from './components/Marketplace';
import Notifications from './components/Notifications';
import EventTrash from './components/EventTrash';
import AdminTrash from './components/AdminTrash';
import Navbar from './components/Navbar';
import NotificationToast from './components/NotificationToast';
import { useExpiringEvents } from './hooks/useExpiringEvents';
import './index.css';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  return user && user.isAdmin ? children : <Navigate to="/" />;
}

function NotificationManager() {
  const { expiringEvents, requestNotificationPermission } = useExpiringEvents();
  
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  if (expiringEvents.length > 0) {
    return (
      <div className="notification-container">
        {expiringEvents.map(event => {
          const daysRemaining = Math.ceil((new Date(event.recoveryExpiresAt) - new Date()) / (1000 * 60 * 60 * 24));
          return (
            <div key={event._id} className={`notification warning ${daysRemaining <= 1 ? 'expiry-critical' : ''}`}>
              <div className="notification-content">
                <div className="notification-title">
                  ⏰ Event Expiring Soon
                </div>
                <div className="notification-message">
                  "{event.title}" will be permanently deleted in {daysRemaining} day(s). 
                  <a href="/trash" style={{ marginLeft: '8px', color: 'inherit', textDecoration: 'underline' }}>
                    Restore now
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}

// Layout component that includes Navbar and wraps all protected content
function LayoutWrapper() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <div className="App">
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <NotificationToast />
      <NotificationManager />
      <main className="main-content">
        <Outlet /> {/* This renders the child routes */}
      </main>
    </div>
  );
}

// Create router with all routes including layout
const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/",
    element: <LayoutWrapper />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "/marketplace",
        element: (
          <ProtectedRoute>
            <Marketplace />
          </ProtectedRoute>
        ),
      },
      {
        path: "/notifications",
        element: (
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        ),
      },
      {
        path: "/trash",
        element: (
          <ProtectedRoute>
            <EventTrash />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/trash",
        element: (
          <AdminRoute>
            <AdminTrash />
          </AdminRoute>
        ),
      },
    ],
  },
  // Catch all route - redirect to dashboard
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <RouterProvider router={router} />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;