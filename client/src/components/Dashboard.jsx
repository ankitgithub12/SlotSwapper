import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DeleteModal from './common/DeleteModal'; // ADD THIS IMPORT

function Dashboard() {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [stats, setStats] = useState({ total: 0, busy: 0, swappable: 0, pending: 0 });
  const [activeTab, setActiveTab] = useState('all');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, event: null }); // ADD DELETE MODAL STATE
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    status: 'BUSY'
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [events]);

  const calculateStats = () => {
    const total = events.length;
    const busy = events.filter(e => e.status === 'BUSY').length;
    const swappable = events.filter(e => e.status === 'SWAPPABLE').length;
    const pending = events.filter(e => e.status === 'SWAP_PENDING').length;
    setStats({ total, busy, swappable, pending });
  };

  const fetchEvents = async () => {
    try {
      const response = await axios.get('/api/events');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  // ADD DELETE MODAL FUNCTIONS
  const openDeleteModal = (event) => {
    setDeleteModal({ isOpen: true, event });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, event: null });
  };

  const handleDeleteEvent = async () => {
    if (!deleteModal.event) return;
    
    try {
      await axios.delete(`/api/events/${deleteModal.event._id}`);
      closeDeleteModal();
      fetchEvents(); // Refresh the list
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error deleting event';
      alert(errorMessage);
      
      // Show helpful message for swap pending error
      if (errorMessage.includes('pending swap')) {
        alert('Cannot delete this event because it has a pending swap request. Please resolve the swap request first.');
      }
      
      closeDeleteModal();
    }
  };

  const validateForm = () => {
    const errors = {};
    const now = new Date();
    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.startTime) {
      errors.startTime = 'Start time is required';
    } else if (start < now) {
      errors.startTime = 'Start time cannot be in the past';
    }

    if (!formData.endTime) {
      errors.endTime = 'End time is required';
    } else if (end <= start) {
      errors.endTime = 'End time must be after start time';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/events', formData);
      setShowForm(false);
      setFormData({ title: '', description: '', startTime: '', endTime: '', status: 'BUSY' });
      setFormErrors({});
      fetchEvents();
    } catch (error) {
      if (error.response?.data?.message) {
        setFormErrors({ submit: error.response.data.message });
      } else {
        setFormErrors({ submit: 'Failed to create event' });
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSwappable = async (eventId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'BUSY' ? 'SWAPPABLE' : 'BUSY';
      await axios.put(`/api/events/${eventId}`, { status: newStatus });
      fetchEvents();
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'BUSY': return 'status-busy';
      case 'SWAPPABLE': return 'status-swappable';
      case 'SWAP_PENDING': return 'status-pending';
      default: return 'status-busy';
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    // Round up to nearest 15 minutes
    const minutes = now.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 15) * 15;
    now.setMinutes(roundedMinutes);
    now.setSeconds(0);
    now.setMilliseconds(0);
    
    return now.toISOString().slice(0, 16);
  };

  const filteredEvents = events.filter(event => {
    if (activeTab === 'all') return true;
    if (activeTab === 'available') return event.status === 'SWAPPABLE';
    if (activeTab === 'busy') return event.status === 'BUSY';
    if (activeTab === 'pending') return event.status === 'SWAP_PENDING';
    return true;
  });

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Time Slot Manager</h1>
        <p className="page-subtitle">Organize your schedule and swap time slots seamlessly</p>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Slots</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.busy}</div>
          <div className="stat-label">Busy</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.swappable}</div>
          <div className="stat-label">Available</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Your Time Slots</h3>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : '+ New Slot'}
          </button>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Slots
          </button>
          <button 
            className={`tab ${activeTab === 'available' ? 'active' : ''}`}
            onClick={() => setActiveTab('available')}
          >
            Available
          </button>
          <button 
            className={`tab ${activeTab === 'busy' ? 'active' : ''}`}
            onClick={() => setActiveTab('busy')}
          >
            Busy
          </button>
          <button 
            className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending
          </button>
        </div>

        {showForm && (
          <div className="card mb-4" style={{ background: 'var(--primary-ultralight)' }}>
            <div className="card-header">
              <h4 style={{ margin: 0, color: 'var(--primary)' }}>Create New Time Slot</h4>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Slot Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Team Meeting, Focus Time, etc."
                  required
                />
                {formErrors.title && (
                  <div className="form-error">
                    {formErrors.title}
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="What's this time slot for?"
                  rows="3"
                />
              </div>
              
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    className="form-control"
                    min={getMinDateTime()}
                    required
                  />
                  {formErrors.startTime && (
                    <div className="form-error">
                      {formErrors.startTime}
                    </div>
                  )}
                </div>
                
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input
                    type="datetime-local"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    className="form-control"
                    min={formData.startTime || getMinDateTime()}
                    required
                  />
                  {formErrors.endTime && (
                    <div className="form-error">
                      {formErrors.endTime}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Slot Status</label>
                <select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value="BUSY">Busy (Not available for swap)</option>
                  <option value="SWAPPABLE">Available for swapping</option>
                </select>
              </div>
              
              {formErrors.submit && (
                <div className="form-error mb-3">
                  {formErrors.submit}
                </div>
              )}
              
              <div className="d-flex gap-2 justify-end">
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  onClick={() => {
                    setShowForm(false);
                    setFormErrors({});
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading}
                  style={{ minWidth: '140px' }}
                >
                  {loading ? (
                    <div className="d-flex align-center gap-2">
                      <div className="spinner"></div>
                      Creating...
                    </div>
                  ) : (
                    'Create Time Slot'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {filteredEvents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon calendar"></div>
            <h3 className="empty-state-title">No time slots found</h3>
            <p className="empty-state-description">
              {activeTab === 'all' 
                ? "You haven't created any time slots yet. Create your first slot to get started!"
                : `No ${activeTab} time slots found.`
              }
            </p>
            {activeTab !== 'all' && (
              <button 
                className="btn btn-outline"
                onClick={() => setActiveTab('all')}
              >
                View All Slots
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-2">
            {filteredEvents.map(event => (
              <div 
                key={event._id} 
                className={`event-card ${event.status.toLowerCase()}`}
              >
                <div className="event-header">
                  <h4 className="event-title">{event.title}</h4>
                  <div className={`status-indicator ${getStatusClass(event.status)}`}>
                    <div className="pulse-dot"></div>
                    {event.status.replace('_', ' ')}
                  </div>
                </div>
                
                {event.description && (
                  <p className="event-description">{event.description}</p>
                )}
                
                <div className="event-details">
                  <div className="event-detail">
                    <span className="detail-label">Starts</span>
                    <span className="detail-value">{formatDate(event.startTime)}</span>
                  </div>
                  <div className="event-detail">
                    <span className="detail-label">Ends</span>
                    <span className="detail-value">{formatDate(event.endTime)}</span>
                  </div>
                </div>
                
                <div className="event-actions">
                  <button 
                    className={`btn btn-sm flex-1 ${event.status === 'SWAPPABLE' ? 'btn-danger' : 'btn-success'}`}
                    onClick={() => toggleSwappable(event._id, event.status)}
                    disabled={event.status === 'SWAP_PENDING'}
                  >
                    {event.status === 'SWAPPABLE' ? 'Mark as Busy' : 'Make Available'}
                  </button>
                  {/* UPDATED DELETE BUTTON - NOW OPENS MODAL */}
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={() => openDeleteModal(event)}
                    disabled={event.status === 'SWAP_PENDING'}
                  >
                    Delete
                  </button>
                </div>
                
                {event.status === 'SWAP_PENDING' && (
                  <div className="d-flex align-center gap-2 p-3 mt-3" style={{ 
                    background: 'var(--warning-light)',
                    color: 'var(--warning)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--warning)',
                    fontSize: '14px'
                  }}>
                    <div className="pulse-dot" style={{ background: 'var(--warning)' }}></div>
                    This slot has a pending swap request
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteEvent}
        title="Move to Trash"
        message={`Are you sure you want to move "${deleteModal.event?.title}" to trash? You can restore it within 30 days.`}
        confirmText="Move to Trash"
        isDanger={true}
      />
    </div>
  );
}

export default Dashboard;