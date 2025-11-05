import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Notifications() {
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [loading, setLoading] = useState({});
  const [activeView, setActiveView] = useState('incoming');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await axios.get('/api/swap/my-requests');
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching swap requests:', error);
    }
  };

  const handleResponse = async (requestId, accepted) => {
    setLoading(prev => ({ ...prev, [requestId]: true }));
    try {
      await axios.post(`/api/swap/swap-response/${requestId}`, { accepted });
      fetchRequests();
    } catch (error) {
      alert(error.response?.data?.message || 'Error processing request');
    } finally {
      setLoading(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Invalid date';
    
    try {
      return new Date(dateString).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'PENDING': return 'pending';
      case 'ACCEPTED': return 'accepted';
      case 'REJECTED': return 'rejected';
      default: return 'pending';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PENDING': return 'Pending Review';
      case 'ACCEPTED': return 'Accepted';
      case 'REJECTED': return 'Declined';
      default: return status || 'Unknown';
    }
  };

  const getEmptyMessage = () => {
    if (activeView === 'incoming') {
      return {
        title: "No Incoming Requests",
        description: "You don't have any pending swap requests from other users. When someone requests to swap time slots with you, they'll appear here.",
        icon: "notification"
      };
    } else {
      return {
        title: "No Outgoing Requests",
        description: "You haven't sent any swap requests to other users yet. Visit the Marketplace to find available time slots to swap.",
        icon: "notification"
      };
    }
  };

  const emptyMessage = getEmptyMessage();

  // Safe data access functions
  const getUserName = (user) => {
    return user?.name || 'Unknown User';
  };

  const getUserInitials = (user) => {
    const name = getUserName(user);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getSlotTitle = (slot) => {
    return slot?.title || 'Unknown Slot';
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Swap Requests</h1>
        <p className="page-subtitle">Manage your time slot exchange requests and collaborations</p>
      </div>

      <div className="notification-card">
        <div className="card-header">
          <h3 className="card-title">Request Management</h3>
          <div className="d-flex align-center gap-2">
            <div className={`status-indicator status-${activeView === 'incoming' ? 'warning' : 'primary'}`}>
              <div className="pulse-dot"></div>
              {activeView === 'incoming' ? 'Incoming' : 'Outgoing'}
            </div>
          </div>
        </div>

        {/* Enhanced Tabs */}
        <div className="enhanced-tabs">
          <button 
            className={`enhanced-tab ${activeView === 'incoming' ? 'active' : ''}`}
            onClick={() => setActiveView('incoming')}
          >
            📥 Incoming Requests
            {requests.incoming && requests.incoming.length > 0 && (
              <span className="tab-badge">
                {requests.incoming.length}
              </span>
            )}
          </button>
          <button 
            className={`enhanced-tab ${activeView === 'outgoing' ? 'active' : ''}`}
            onClick={() => setActiveView('outgoing')}
          >
            📤 Outgoing Requests
            {requests.outgoing && requests.outgoing.length > 0 && (
              <span className="tab-badge">
                {requests.outgoing.length}
              </span>
            )}
          </button>
        </div>
            
        {activeView === 'incoming' ? (
          !requests.incoming || requests.incoming.length === 0 ? (
            <div className="enhanced-empty-state">
              <div className="enhanced-empty-state-icon notification"></div>
              <h3 className="enhanced-empty-state-title">{emptyMessage.title}</h3>
              <p className="enhanced-empty-state-description">{emptyMessage.description}</p>
              <button className="btn btn-primary">
                Explore Marketplace
              </button>
            </div>
          ) : (
            <div>
              {requests.incoming
                .filter(request => request && request._id)
                .map(request => (
                <div key={request._id} className={`enhanced-request-item incoming ${getStatusClass(request.status)}`}>
                  <div className="enhanced-request-header">
                    <div style={{ flex: 1 }}>
                      <div className="enhanced-request-user">
                        <div className="user-avatar-small">
                          {getUserInitials(request.requesterId)}
                        </div>
                        {getUserName(request.requesterId)}
                      </div>
                      <p className="enhanced-request-subtitle">
                        wants to exchange time slots with you
                      </p>
                    </div>
                    <div className={`enhanced-status-badge ${getStatusClass(request.status)}`}>
                      <div className="pulse-dot"></div>
                      {getStatusLabel(request.status)}
                    </div>
                  </div>
                  
                  <div className="enhanced-request-details">
                    <div className="enhanced-request-detail">
                      <span className="enhanced-request-label">Their Offer</span>
                      <span className="enhanced-request-value">{getSlotTitle(request.requesterSlotId)}</span>
                    </div>
                    <div className="enhanced-request-detail">
                      <span className="enhanced-request-label">Requesting Your</span>
                      <span className="enhanced-request-value">{getSlotTitle(request.requesteeSlotId)}</span>
                    </div>
                    <div className="enhanced-request-detail">
                      <span className="enhanced-request-label">Requested At</span>
                      <div className="time-badge">
                        🕒 {formatDate(request.createdAt)}
                      </div>
                    </div>
                  </div>
                  
                  {request.status === 'PENDING' && (
                    <div className="enhanced-request-actions">
                      <button 
                        className="btn-with-icon btn-accept flex-1"
                        onClick={() => handleResponse(request._id, true)}
                        disabled={loading[request._id]}
                      >
                        {loading[request._id] ? (
                          <div className="d-flex align-center justify-center gap-2">
                            <div className="spinner"></div>
                            Accepting...
                          </div>
                        ) : (
                          <>
                            ✓ Accept Swap
                          </>
                        )}
                      </button>
                      <button 
                        className="btn-with-icon btn-decline flex-1"
                        onClick={() => handleResponse(request._id, false)}
                        disabled={loading[request._id]}
                      >
                        {loading[request._id] ? (
                          <div className="d-flex align-center justify-center gap-2">
                            <div className="spinner"></div>
                            Declining...
                          </div>
                        ) : (
                          <>
                            ✗ Decline
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          !requests.outgoing || requests.outgoing.length === 0 ? (
            <div className="enhanced-empty-state">
              <div className="enhanced-empty-state-icon notification"></div>
              <h3 className="enhanced-empty-state-title">{emptyMessage.title}</h3>
              <p className="enhanced-empty-state-description">{emptyMessage.description}</p>
              <button className="btn btn-primary">
                Browse Available Slots
              </button>
            </div>
          ) : (
            <div>
              {requests.outgoing
                .filter(request => request && request._id)
                .map(request => (
                <div key={request._id} className={`enhanced-request-item outgoing ${getStatusClass(request.status)}`}>
                  <div className="enhanced-request-header">
                    <div style={{ flex: 1 }}>
                      <div className="enhanced-request-user">
                        <div className="user-avatar-small">
                          {getUserInitials(request.requesteeId)}
                        </div>
                        {getUserName(request.requesteeId)}
                      </div>
                      <p className="enhanced-request-subtitle">
                        You requested to exchange time slots
                      </p>
                    </div>
                    <div className={`enhanced-status-badge ${getStatusClass(request.status)}`}>
                      <div className="pulse-dot"></div>
                      {getStatusLabel(request.status)}
                    </div>
                  </div>
                  
                  <div className="enhanced-request-details">
                    <div className="enhanced-request-detail">
                      <span className="enhanced-request-label">Your Offer</span>
                      <span className="enhanced-request-value">{getSlotTitle(request.requesterSlotId)}</span>
                    </div>
                    <div className="enhanced-request-detail">
                      <span className="enhanced-request-label">Requesting Their</span>
                      <span className="enhanced-request-value">{getSlotTitle(request.requesteeSlotId)}</span>
                    </div>
                    <div className="enhanced-request-detail">
                      <span className="enhanced-request-label">Sent At</span>
                      <div className="time-badge">
                        🕒 {formatDate(request.createdAt)}
                      </div>
                    </div>
                  </div>

                  {request.status === 'PENDING' && (
                    <div style={{ 
                      padding: '16px',
                      background: 'var(--warning-light)',
                      border: '1px solid var(--warning)',
                      borderRadius: 'var(--radius)',
                      color: 'var(--warning)',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <div className="pulse-dot" style={{ background: 'var(--warning)' }}></div>
                      Waiting for user response...
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default Notifications;