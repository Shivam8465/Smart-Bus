const express        = require('express');
const router         = express.Router();
const Bus            = require('../models/Bus');
const authMiddleware = require('../middleware/auth');
const protect        = authMiddleware.protect;
const authorizeRole  = authMiddleware.authorizeRole;

// ── GET ALL BUSES (Passenger and Admin can see) ──
router.get('/', protect, async (req, res) => {
  try {
    const buses = await Bus.find();
    res.status(200).json({
      message: 'Buses fetched successfully',
      count:   buses.length,
      buses
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// ── GET SINGLE BUS BY ID ──
router.get('/:id', protect, async (req, res) => {
  try {
    const bus = await Bus.findOne({ busId: req.params.id });
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }
    res.status(200).json({ message: 'Bus found', bus });
  } catch (error) {
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// ── ADD NEW BUS (Admin only) ──
router.post('/', protect, authorizeRole('admin'), async (req, res) => {
  try {
    const { busId, route, driver, capacity } = req.body;

    if (!busId || !route || !driver) {
      return res.status(400).json({ 
        message: 'Bus ID, route, and driver are required' 
      });
    }

    // Check if bus ID already exists
    const existing = await Bus.findOne({ busId });
    if (existing) {
      return res.status(400).json({ 
        message: 'Bus ID already exists' 
      });
    }

    const newBus = new Bus({
      busId,
      route,
      driver,
      capacity: capacity || 50
    });

    await newBus.save();

    res.status(201).json({
      message: 'Bus added successfully',
      bus:     newBus
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// ── UPDATE BUS (Admin only) ──
router.put('/:id', protect, authorizeRole('admin'), async (req, res) => {
  try {
    const bus = await Bus.findOneAndUpdate(
      { busId: req.params.id },
      req.body,
      { new: true }
    );

    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    res.status(200).json({
      message: 'Bus updated successfully',
      bus
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// ── UPDATE BUS LOCATION AND PASSENGERS (Driver only) ──
router.patch('/:id/location', protect, authorizeRole('driver'), async (req, res) => {
  try {
    const { passengers, currentStop, status, latitude, longitude } = req.body;

    const bus = await Bus.findOneAndUpdate(
      { busId: req.params.id },
      { passengers, currentStop, status, latitude, longitude },
      { new: true }
    );

    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    res.status(200).json({
      message: 'Bus location updated successfully',
      bus
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// ── DELETE BUS (Admin only) ──
router.delete('/:id', protect, authorizeRole('admin'), async (req, res) => {
  try {
    const bus = await Bus.findOneAndDelete({ busId: req.params.id });

    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    res.status(200).json({
      message: `Bus ${req.params.id} removed successfully`
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;