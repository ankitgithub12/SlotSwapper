import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const { user, getUserId } = useAuth();

  useEffect(() => {
    const userId = getUserId();
    
    if (user && userId) {
      console.log('Initializing socket connection for user:', userId);
      
      const newSocket = io('https://slotswapper-backend-kapb.onrender.com', {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });
      
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Socket connected successfully:', newSocket.id);
        setIsConnected(true);
        
        // Join user's personal room after connection
        newSocket.emit('join-user', userId);
        console.log('Joined user room:', userId);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts');
        setIsConnected(true);
        
        // Re-join user room after reconnection
        newSocket.emit('join-user', userId);
      });

      // Listen for notifications
      newSocket.on('new-swap-request', (data) => {
        console.log('New swap request received:', data);
        setNotifications(prev => [{
          id: Date.now(),
          type: 'info',
          message: data.message,
          timestamp: new Date()
        }, ...prev]);
      });

      newSocket.on('swap-accepted', (data) => {
        console.log('Swap accepted received:', data);
        setNotifications(prev => [{
          id: Date.now(),
          type: 'success',
          message: data.message,
          timestamp: new Date()
        }, ...prev]);
      });

      newSocket.on('swap-rejected', (data) => {
        console.log('Swap rejected received:', data);
        setNotifications(prev => [{
          id: Date.now(),
          type: 'error',
          message: data.message,
          timestamp: new Date()
        }, ...prev]);
      });

      return () => {
        console.log('Cleaning up socket connection');
        newSocket.close();
      };
    } else {
      // Clean up socket if user logs out or has no ID
      if (socket) {
        console.log('Cleaning up socket - no user or invalid user ID');
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [user, getUserId]);

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const value = {
    socket,
    notifications,
    isConnected,
    addNotification,
    removeNotification
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}