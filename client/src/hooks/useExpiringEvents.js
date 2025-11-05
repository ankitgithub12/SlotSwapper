import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

export function useExpiringEvents() {
  const [expiringEvents, setExpiringEvents] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      checkExpiringEvents();
      
      // Check every hour
      const interval = setInterval(checkExpiringEvents, 60 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const checkExpiringEvents = async () => {
    try {
      const response = await axios.get('/api/events/notifications/expiring');
      setExpiringEvents(response.data);
      
      // Show browser notifications for critical expirations (1 day or less)
      if ('Notification' in window && Notification.permission === 'granted') {
        response.data.forEach(event => {
          const daysRemaining = Math.ceil((new Date(event.recoveryExpiresAt) - new Date()) / (1000 * 60 * 60 * 24));
          if (daysRemaining <= 1) {
            new Notification('⏰ Event About to Be Permanently Deleted', {
              body: `"${event.title}" will be permanently deleted in ${daysRemaining} day(s). Restore it now from Recently Deleted.`,
              icon: '/favicon.ico',
              tag: `expiring-${event._id}`,
              requireInteraction: true
            });
          }
        });
      }
    } catch (error) {
      console.error('Error checking expiring events:', error);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    }
  };

  return { expiringEvents, requestNotificationPermission };
}