import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Marketplace() {
  const [slots, setSlots] = useState([]);
  const [mySwappableSlots, setMySwappableSlots] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSwappableSlots();
    fetchMySwappableSlots();
  }, []);

  const fetchSwappableSlots = async () => {
    try {
      const response = await axios.get('/api/swap/swappable-slots');
      setSlots(response.data);
    } catch (error) {
      console.error('Error fetching swappable slots:', error);
    }
  };

  const fetchMySwappableSlots = async () => {
    try {
      const response = await axios.get('/api/events');
      const swappable = response.data.filter(event => event.status === 'SWAPPABLE');
      setMySwappableSlots(swappable);
    } catch (error) {
      console.error('Error fetching my slots:', error);
    }
  };

  const requestSwap = async (theirSlotId, mySlotId) => {
    setLoading(true);
    try {
      await axios.post('/api/swap/swap-request', { mySlotId, theirSlotId });
      setShowModal(false);
      setSelectedSlot(null);
      fetchSwappableSlots();
      fetchMySwappableSlots();
    } catch (error) {
      alert(error.response?.data?.message || 'Error sending swap request');
    } finally {
      setLoading(false);
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

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Marketplace</h1>
        <p className="page-subtitle">Browse available time slots from other users</p>
      </div>

      <div className="card">
        {slots.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon market"></div>
            <h3 className="empty-state-title">No available slots</h3>
            <p className="empty-state-description">
              There are currently no swappable slots from other users. Check back later or create your own swappable slots.
            </p>
          </div>
        ) : (
          <div className="grid grid-2">
            {slots.map(slot => (
              <div key={slot._id} className="event-card swappable">
                <div className="event-header">
                  <h4 className="event-title">{slot.title}</h4>
                  <div className="status-indicator status-swappable">
                    <div className="pulse-dot"></div>
                    Available
                  </div>
                </div>
                
                {slot.description && (
                  <p className="event-description">{slot.description}</p>
                )}
                
                <div className="event-details">
                  <div className="event-detail">
                    <span className="detail-label">Owner</span>
                    <span className="detail-value">{slot.userId.name}</span>
                  </div>
                  <div className="event-detail">
                    <span className="detail-label">Starts</span>
                    <span className="detail-value">{formatDate(slot.startTime)}</span>
                  </div>
                  <div className="event-detail">
                    <span className="detail-label">Ends</span>
                    <span className="detail-value">{formatDate(slot.endTime)}</span>
                  </div>
                </div>
                
                <button 
                  className="btn btn-primary w-100"
                  onClick={() => {
                    setSelectedSlot(slot);
                    setShowModal(true);
                  }}
                >
                  Request Swap
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button 
              className="modal-close"
              onClick={() => setShowModal(false)}
              aria-label="Close modal"
            />
            <h3 className="card-title mb-3">Request Swap</h3>
            <p className="text-light mb-4">
              Select one of your available slots to offer for <strong>"{selectedSlot?.title}"</strong>
            </p>
            
            {mySwappableSlots.length === 0 ? (
              <div className="empty-state p-0">
                <div className="empty-state-icon calendar mb-3"></div>
                <p className="empty-state-description mb-3">
                  You don't have any available slots. Mark some of your events as available first.
                </p>
                <button 
                  className="btn btn-outline"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </div>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {mySwappableSlots.map(slot => (
                  <div key={slot._id} className="request-item">
                    <div className="request-header">
                      <div className="request-user">{slot.title}</div>
                      <div className="status-indicator status-swappable">
                        <div className="pulse-dot"></div>
                        Available
                      </div>
                    </div>
                    <div className="request-details">
                      <div className="request-detail">
                        <span className="request-label">Starts</span>
                        <span className="request-value">{formatDate(slot.startTime)}</span>
                      </div>
                      <div className="request-detail">
                        <span className="request-label">Ends</span>
                        <span className="request-value">{formatDate(slot.endTime)}</span>
                      </div>
                    </div>
                    <div className="request-actions">
                      <button 
                        className="btn btn-success btn-sm flex-1"
                        onClick={() => requestSwap(selectedSlot._id, slot._id)}
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="d-flex align-center justify-center gap-2">
                            <div className="spinner"></div>
                            Requesting...
                          </div>
                        ) : (
                          'Offer This Slot'
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Marketplace;