import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DeleteModal from './common/DeleteModal';

function EventTrash() {
  const [deletedEvents, setDeletedEvents] = useState([]);
  const [selectedEvents, setSelectedEvents] = useState(new Set());
  const [loading, setLoading] = useState({});
  const [bulkAction, setBulkAction] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, events: [] });

  useEffect(() => {
    fetchDeletedEvents();
  }, []);

  const fetchDeletedEvents = async () => {
    try {
      const response = await axios.get('/api/events/trash');
      setDeletedEvents(response.data);
      setSelectedEvents(new Set()); // Clear selection on refresh
    } catch (error) {
      console.error('Error fetching deleted events:', error);
      alert('Error loading deleted events');
    }
  };

  const restoreEvent = async (eventId) => {
    setLoading(prev => ({ ...prev, [eventId]: true }));
    try {
      await axios.post(`/api/events/${eventId}/restore`);
      fetchDeletedEvents();
    } catch (error) {
      alert(error.response?.data?.message || 'Error restoring event');
    } finally {
      setLoading(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const permanentDelete = async (eventId) => {
    setLoading(prev => ({ ...prev, [eventId]: true }));
    try {
      await axios.delete(`/api/events/${eventId}/permanent`);
      fetchDeletedEvents();
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting event');
    } finally {
      setLoading(prev => ({ ...prev, [eventId]: false }));
    }
  };

  // Bulk operations
  const handleSelectEvent = (eventId) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEvents(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedEvents.size === deletedEvents.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(deletedEvents.map(event => event._id)));
    }
  };

  const executeBulkAction = async () => {
    if (selectedEvents.size === 0) {
      alert('Please select events to perform bulk action');
      return;
    }

    if (bulkAction === 'restore') {
      // Bulk restore
      setLoading(prev => ({ ...prev, bulk: true }));
      try {
        await Promise.all(
          Array.from(selectedEvents).map(eventId =>
            axios.post(`/api/events/${eventId}/restore`)
          )
        );
        fetchDeletedEvents();
        setBulkAction('');
      } catch (error) {
        alert('Error restoring some events');
      } finally {
        setLoading(prev => ({ ...prev, bulk: false }));
      }
    } else if (bulkAction === 'delete') {
      // Open delete confirmation modal for bulk delete
      const eventsToDelete = deletedEvents.filter(event => 
        selectedEvents.has(event._id)
      );
      setDeleteModal({ isOpen: true, events: eventsToDelete });
    }
  };

  const handleBulkDelete = async () => {
    setLoading(prev => ({ ...prev, bulk: true }));
    try {
      await Promise.all(
        deleteModal.events.map(event =>
          axios.delete(`/api/events/${event._id}/permanent`)
        )
      );
      fetchDeletedEvents();
      setDeleteModal({ isOpen: false, events: [] });
      setBulkAction('');
    } catch (error) {
      alert('Error deleting some events');
    } finally {
      setLoading(prev => ({ ...prev, bulk: false }));
    }
  };

  const getDaysRemaining = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getExpiryColor = (days) => {
    if (days <= 3) return 'error';
    if (days <= 7) return 'warning';
    return 'success';
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Recently Deleted</h1>
        <p className="page-subtitle">Restore or permanently delete your events</p>
      </div>

      <div className="card">
        {/* Bulk Actions Header */}
        {deletedEvents.length > 0 && (
          <div className="card-header">
            <div className="d-flex align-center justify-between w-100">
              <div className="d-flex align-center gap-3">
                <div className="form-group mb-0">
                  <input
                    type="checkbox"
                    checked={selectedEvents.size === deletedEvents.length && deletedEvents.length > 0}
                    onChange={handleSelectAll}
                    className="form-checkbox"
                  />
                </div>
                <span className="text-sm">
                  {selectedEvents.size} of {deletedEvents.length} selected
                </span>
              </div>
              
              <div className="d-flex align-center gap-2">
                <select 
                  value={bulkAction} 
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="form-control"
                  style={{ minWidth: '140px' }}
                >
                  <option value="">Bulk Actions</option>
                  <option value="restore">Restore Selected</option>
                  <option value="delete">Delete Permanently</option>
                </select>
                
                <button 
                  className="btn btn-primary"
                  onClick={executeBulkAction}
                  disabled={!bulkAction || selectedEvents.size === 0 || loading.bulk}
                >
                  {loading.bulk ? (
                    <div className="d-flex align-center gap-2">
                      <div className="spinner"></div>
                      Applying...
                    </div>
                  ) : (
                    'Apply'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {deletedEvents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"></div>
            <h3 className="empty-state-title">Trash is Empty</h3>
            <p className="empty-state-description">
              No deleted events found. Events you delete will appear here for 30 days.
            </p>
          </div>
        ) : (
          <div className="grid grid-1">
            {deletedEvents.map(event => (
              <div key={event._id} className="event-card deleted">
                <div className="event-header">
                  <div className="d-flex align-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedEvents.has(event._id)}
                      onChange={() => handleSelectEvent(event._id)}
                      className="form-checkbox"
                    />
                    <div>
                      <h4 className="event-title">{event.title}</h4>
                      {event.description && (
                        <p className="event-description">{event.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="d-flex align-center gap-3">
                    <div className={`status-indicator status-${getExpiryColor(getDaysRemaining(event.recoveryExpiresAt))}`}>
                      <div className="pulse-dot"></div>
                      {getDaysRemaining(event.recoveryExpiresAt)} days left
                    </div>
                  </div>
                </div>
                
                <div className="event-details">
                  <div className="event-detail">
                    <span className="detail-label">Originally Scheduled</span>
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
                    <span className="detail-label">Permanent Deletion</span>
                    <span className="detail-value">
                      {new Date(event.recoveryExpiresAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="event-actions">
                  <button 
                    className="btn btn-success btn-sm"
                    onClick={() => restoreEvent(event._id)}
                    disabled={loading[event._id]}
                  >
                    {loading[event._id] ? (
                      <div className="d-flex align-center gap-2">
                        <div className="spinner"></div>
                        Restoring...
                      </div>
                    ) : (
                      'Restore'
                    )}
                  </button>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => permanentDelete(event._id)}
                    disabled={loading[event._id]}
                  >
                    {loading[event._id] ? (
                      <div className="d-flex align-center gap-2">
                        <div className="spinner"></div>
                        Deleting...
                      </div>
                    ) : (
                      'Delete Permanently'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bulk Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, events: [] })}
        onConfirm={handleBulkDelete}
        title="Permanently Delete Events"
        message={`Are you sure you want to permanently delete ${deleteModal.events.length} event(s)? This action cannot be undone.`}
        confirmText={`Delete ${deleteModal.events.length} Events`}
        isDanger={true}
      />
    </div>
  );
}

export default EventTrash;