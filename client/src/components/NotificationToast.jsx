import React from 'react';
import { useSocket } from '../contexts/SocketContext';

function NotificationToast() {
  const { notifications, removeNotification, isConnected } = useSocket();

  const getNotificationType = (type) => {
    switch (type) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  };

  return (
    <div className="notification-container">
      {/* Connection Status Indicator */}
      {!isConnected && (
        <div className="notification warning">
          <div className="notification-content">
            <div className="notification-title">
              Connection Lost
            </div>
            <div className="notification-message">
              Real-time updates unavailable. Reconnecting...
            </div>
          </div>
          <button
            className="notification-close"
            onClick={() => {}} // Don't allow closing connection status
            aria-label="Close notification"
            disabled
          />
        </div>
      )}
      
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`notification ${getNotificationType(notification.type)}`}
        >
          <div className="notification-content">
            <div className="notification-title">
              {notification.message}
            </div>
            <div className="notification-message">
              {notification.timestamp.toLocaleTimeString()}
            </div>
          </div>
          <button
            className="notification-close"
            onClick={() => removeNotification(notification.id)}
            aria-label="Close notification"
          />
        </div>
      ))}
    </div>
  );
}

export default NotificationToast;