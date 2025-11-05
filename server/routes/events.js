const express = require('express');
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get all NON-DELETED events for current user
router.get('/', auth, async (req, res) => {
  try {
    const events = await Event.find({ 
      userId: req.user.id,
      deleted: false  // ONLY GET NON-DELETED EVENTS
    }).sort({ startTime: 1 });
    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's deleted events (for trash/recovery)
router.get('/trash', auth, async (req, res) => {
  try {
    const deletedEvents = await Event.find({ 
      userId: req.user.id,
      deleted: true,
      recoveryExpiresAt: { $gt: new Date() } // Only events that haven't expired
    }).sort({ deletedAt: -1 });
    
    res.json(deletedEvents);
  } catch (error) {
    console.error('Get trash events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create event with enhanced validation
router.post('/', [
  auth,
  body('title').notEmpty().withMessage('Title is required').isLength({ max: 100 }).withMessage('Title too long'),
  body('startTime').isISO8601().withMessage('Valid start time is required'),
  body('endTime').isISO8601().withMessage('Valid end time is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, startTime, endTime, status = 'BUSY' } = req.body;

    // Convert to Date objects for comparison
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    // Validation: Start time cannot be in the past
    if (start < now) {
      return res.status(400).json({ 
        message: 'Start time cannot be in the past' 
      });
    }

    // Validation: End time must be after start time
    if (end <= start) {
      return res.status(400).json({ 
        message: 'End time must be after start time' 
      });
    }

    // Validation: Event cannot be longer than 24 hours
    const duration = end - start;
    const maxDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    if (duration > maxDuration) {
      return res.status(400).json({ 
        message: 'Event cannot be longer than 24 hours' 
      });
    }

    const event = new Event({
      title,
      description,
      startTime: start,
      endTime: end,
      status,
      userId: req.user.id
    });

    await event.save();
    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update event with validation
router.put('/:id', [
  auth,
  body('title').optional().isLength({ max: 100 }).withMessage('Title too long'),
  body('startTime').optional().isISO8601().withMessage('Valid start time is required'),
  body('endTime').optional().isISO8601().withMessage('Valid end time is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const event = await Event.findOne({ 
      _id: req.params.id, 
      userId: req.user.id,
      deleted: false  // CANNOT UPDATE DELETED EVENTS
    });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Validate time constraints if times are being updated
    if (req.body.startTime || req.body.endTime) {
      const start = new Date(req.body.startTime || event.startTime);
      const end = new Date(req.body.endTime || event.endTime);
      const now = new Date();

      if (req.body.startTime && start < now) {
        return res.status(400).json({ 
          message: 'Start time cannot be in the past' 
        });
      }

      if (end <= start) {
        return res.status(400).json({ 
          message: 'End time must be after start time' 
        });
      }

      const duration = end - start;
      const maxDuration = 24 * 60 * 60 * 1000;
      if (duration > maxDuration) {
        return res.status(400).json({ 
          message: 'Event cannot be longer than 24 hours' 
        });
      }
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json(updatedEvent);
  } catch (error) {
    console.error('Update event error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// SOFT DELETE event (move to trash)
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findOne({ 
      _id: req.params.id, 
      userId: req.user.id,
      deleted: false  // CANNOT DELETE ALREADY DELETED EVENTS
    });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if event is involved in pending swap
    if (event.status === 'SWAP_PENDING') {
      return res.status(400).json({ 
        message: 'Cannot delete event with pending swap request' 
      });
    }

    // SOFT DELETE - mark as deleted instead of removing
    event.deleted = true;
    event.deletedAt = new Date();
    event.deletedBy = req.user.id;
    await event.save();

    res.json({ 
      message: 'Event moved to trash', 
      event: {
        id: event._id,
        title: event.title,
        deletedAt: event.deletedAt
      }
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// RESTORE event from trash
router.post('/:id/restore', auth, async (req, res) => {
  try {
    const event = await Event.findOne({ 
      _id: req.params.id, 
      userId: req.user.id,
      deleted: true  // CAN ONLY RESTORE DELETED EVENTS
    });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found in trash' });
    }

    // Check if recovery period hasn't expired
    if (event.recoveryExpiresAt < new Date()) {
      return res.status(400).json({ 
        message: 'Cannot restore event - recovery period has expired' 
      });
    }

    // RESTORE - mark as not deleted
    event.deleted = false;
    event.deletedAt = null;
    event.deletedBy = null;
    await event.save();

    res.json({ 
      message: 'Event restored successfully', 
      event 
    });
  } catch (error) {
    console.error('Restore event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PERMANENT DELETE event (from trash)
router.delete('/:id/permanent', auth, async (req, res) => {
  try {
    const event = await Event.findOne({ 
      _id: req.params.id, 
      userId: req.user.id,
      deleted: true  // CAN ONLY PERMANENTLY DELETE FROM TRASH
    });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found in trash' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event permanently deleted' });
  } catch (error) {
    console.error('Permanent delete event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Add these routes before module.exports

// Get all deleted events (Admin only)
router.get('/admin/trash', auth, async (req, res) => {
  try {
    // Check if user is admin (you'll need to add admin field to your User model)
    const user = await User.findById(req.user.id);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const deletedEvents = await Event.find({ 
      deleted: true 
    })
    .populate('userId', 'name email')
    .populate('deletedBy', 'name email')
    .sort({ deletedAt: -1 });
    
    res.json(deletedEvents);
  } catch (error) {
    console.error('Admin get trash error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get events expiring soon (for notifications)
router.get('/notifications/expiring', auth, async (req, res) => {
  try {
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    
    const expiringEvents = await Event.find({
      userId: req.user.id,
      deleted: true,
      recoveryExpiresAt: { 
        $lte: threeDaysFromNow,
        $gt: new Date() // Not expired yet
      }
    }).sort({ recoveryExpiresAt: 1 });
    
    res.json(expiringEvents);
  } catch (error) {
    console.error('Get expiring events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk restore events
router.post('/bulk/restore', auth, async (req, res) => {
  try {
    const { eventIds } = req.body;
    
    if (!eventIds || !Array.isArray(eventIds)) {
      return res.status(400).json({ message: 'Event IDs array is required' });
    }

    const result = await Event.updateMany(
      { 
        _id: { $in: eventIds },
        userId: req.user.id,
        deleted: true
      },
      {
        $set: {
          deleted: false,
          deletedAt: null,
          deletedBy: null
        }
      }
    );

    res.json({ 
      message: `Successfully restored ${result.modifiedCount} events`,
      restoredCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk restore error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk permanent delete
router.post('/bulk/delete', auth, async (req, res) => {
  try {
    const { eventIds } = req.body;
    
    if (!eventIds || !Array.isArray(eventIds)) {
      return res.status(400).json({ message: 'Event IDs array is required' });
    }

    const result = await Event.deleteMany({
      _id: { $in: eventIds },
      userId: req.user.id,
      deleted: true
    });

    res.json({ 
      message: `Successfully deleted ${result.deletedCount} events permanently`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
module.exports = router;