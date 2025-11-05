import React from 'react';

function DeleteModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Delete", isDanger = true }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <p>{message}</p>
        </div>
        
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button 
            className={isDanger ? "btn btn-danger" : "btn btn-warning"} 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteModal;