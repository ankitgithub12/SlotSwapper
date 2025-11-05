const express = require('express');
const Event = require('../models/Event');
const SwapRequest = require('../models/SwapRequest');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all swappable slots from other users
router.get('/swappable-slots', auth, async (req, res) => {
  try {
    const swappableSlots = await Event.find({
      status: 'SWAPPABLE',
      userId: { $ne: req.user.id }
    }).populate('userId', 'name email');

    res.json(swappableSlots);
  } catch (error) {
    console.error('Get swappable slots error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create swap request
router.post('/swap-request', auth, async (req, res) => {
  const session = await Event.startSession();
  session.startTransaction();

  try {
    const { mySlotId, theirSlotId } = req.body;

    // Verify both slots exist and are SWAPPABLE
    const mySlot = await Event.findOne({ _id: mySlotId, userId: req.user.id });
    const theirSlot = await Event.findOne({ _id: theirSlotId, status: 'SWAPPABLE' });

    if (!mySlot || !theirSlot) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'One or both slots not found or not available' });
    }

    if (mySlot.status !== 'SWAPPABLE') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Your slot is not swappable' });
    }

    // Create swap request
    const swapRequest = new SwapRequest({
      requesterId: req.user.id,
      requesteeId: theirSlot.userId,
      requesterSlotId: mySlotId,
      requesteeSlotId: theirSlotId,
      status: 'PENDING'
    });

    // Update both slots to SWAP_PENDING
    mySlot.status = 'SWAP_PENDING';
    theirSlot.status = 'SWAP_PENDING';

    await mySlot.save({ session });
    await theirSlot.save({ session });
    await swapRequest.save({ session });

    await session.commitTransaction();
    
    // Send real-time notification to the requestee
    const io = req.app.get('io');
    io.to(theirSlot.userId.toString()).emit('new-swap-request', {
      message: `New swap request from ${req.user.name}`,
      swapRequest: swapRequest,
      type: 'INCOMING_REQUEST'
    });
    
    res.status(201).json(swapRequest);
  } catch (error) {
    await session.abortTransaction();
    console.error('Swap request error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    session.endSession();
  }
});

// Respond to swap request
router.post('/swap-response/:requestId', auth, async (req, res) => {
  const session = await Event.startSession();
  session.startTransaction();

  try {
    const { accepted } = req.body;
    const swapRequest = await SwapRequest.findById(req.params.requestId)
      .populate('requesterSlotId')
      .populate('requesteeSlotId');

    if (!swapRequest || swapRequest.requesteeId.toString() !== req.user.id) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Swap request not found' });
    }

    if (swapRequest.status !== 'PENDING') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Swap request already processed' });
    }

    if (accepted) {
      // Swap the owners
      const tempUserId = swapRequest.requesterSlotId.userId;
      swapRequest.requesterSlotId.userId = swapRequest.requesteeSlotId.userId;
      swapRequest.requesteeSlotId.userId = tempUserId;

      // Set both slots to BUSY
      swapRequest.requesterSlotId.status = 'BUSY';
      swapRequest.requesteeSlotId.status = 'BUSY';
      swapRequest.status = 'ACCEPTED';

      await swapRequest.requesterSlotId.save({ session });
      await swapRequest.requesteeSlotId.save({ session });
      
      // Send real-time notification to the requester
      const io = req.app.get('io');
      io.to(swapRequest.requesterId.toString()).emit('swap-accepted', {
        message: `${req.user.name} accepted your swap request!`,
        type: 'SWAP_ACCEPTED'
      });
    } else {
      // Reject: set both slots back to SWAPPABLE
      swapRequest.requesterSlotId.status = 'SWAPPABLE';
      swapRequest.requesteeSlotId.status = 'SWAPPABLE';
      swapRequest.status = 'REJECTED';

      await swapRequest.requesterSlotId.save({ session });
      await swapRequest.requesteeSlotId.save({ session });
      
      // Send real-time notification to the requester
      const io = req.app.get('io');
      io.to(swapRequest.requesterId.toString()).emit('swap-rejected', {
        message: `${req.user.name} rejected your swap request.`,
        type: 'SWAP_REJECTED'
      });
    }

    await swapRequest.save({ session });
    await session.commitTransaction();

    res.json({ message: `Swap request ${accepted ? 'accepted' : 'rejected'}` });
  } catch (error) {
    await session.abortTransaction();
    console.error('Swap response error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    session.endSession();
  }
});

// Get user's swap requests
router.get('/my-requests', auth, async (req, res) => {
  try {
    const incoming = await SwapRequest.find({ requesteeId: req.user.id })
      .populate('requesterId', 'name email')
      .populate('requesterSlotId')
      .populate('requesteeSlotId')
      .sort({ createdAt: -1 });

    const outgoing = await SwapRequest.find({ requesterId: req.user.id })
      .populate('requesteeId', 'name email')
      .populate('requesterSlotId')
      .populate('requesteeSlotId')
      .sort({ createdAt: -1 });

    res.json({ incoming, outgoing });
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;