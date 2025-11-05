import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminTrash() {
  const [allDeletedEvents, setAllDeletedEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAllDeletedEvents();
  }, []);

  const fetchAllDeletedEvents = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/events/admin/trash');
      setAllDeletedEvents(response.data);
    } catch (error) {
      if (error.response?.status === 403) {
        alert('Admin access required');
      } else {
        alert('Error loading deleted events');
      }
    } finally {
      setLoading(false);
    }
  };

  const restoreEventAsAdmin = async (eventId) => {
    try {
      await axios.post(`/api/events/${eventId}/restore`);
      fetchAllDeletedEvents();
    } catch (error) {
      alert('Error restoring event');
    }
  };

  if (loading) {
    return <div className="container">Loading admin panel...</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Admin - Deleted Events</h1>
        <p className="page-subtitle">Manage all users' deleted events</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Deleted Events ({allDeletedEvents.length})</h3>
        </div>

        {allDeletedEvents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"></div>
            <h3 className="empty-state-title">No Deleted Events</h3>
            <p className="empty-state-description">
              No events have been deleted by any users.
            </p>
          </div>
        ) : (
          <div className="grid grid-1">
            {allDeletedEvents.map(event => (
              <div key={event._id} className="event-card deleted">
                <div className="event-header">
                  <div>
                    <h4 className="event-title">{event.title}</h4>
                    <p className="event-description">
                      User: {event.userId?.name || 'Unknown'} ({event.userId?.email})
                    </p>
                  </div>
                  <div className="status-indicator status-warning">
                    <div className="pulse-dot"></div>
                    Deleted by {event.deletedBy?.name || 'User'}
                  </div>
                </div>
                
                <div className="event-details">
                  <div className="event-detail">
                    <span className="detail-label">Original Time</span>
                    <span className="detail-value">
                      {new Date(event.startTime).toLocaleString()} - {new Date(event.endTime).toLocaleString()}
                    </span>
                  </div>
                  <div className="event-detail">
                    <span className="detail-label">Deleted On</span>
                    <span className="detail-value">
                      {new Date(event.deletedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="event-detail">
                    <span className="detail-label">Expires</span>
                    <span className="detail-value">
                      {new Date(event.recoveryExpiresAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="event-actions">
                  <button 
                    className="btn btn-success btn-sm"
                    onClick={() => restoreEventAsAdmin(event._id)}
                  >
                    Restore as Admin
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminTrash;