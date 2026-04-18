const express        = require('express');
const router         = express.Router();
const Bus            = require('../models/Bus');
const authMiddleware = require('../middleware/auth');
const protect        = authMiddleware.protect;
const authorizeRole  = authMiddleware.authorizeRole;

function normalizeName(value = '') {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

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

// ── GET LOGGED-IN DRIVER'S ASSIGNED BUS ──
router.get('/my-bus', protect, authorizeRole('driver'), async (req, res) => {
  try {
    const userName = normalizeName(req.user?.name || '');
    if (!userName) {
      return res.status(400).json({ message: 'Driver profile is missing name' });
    }

    const buses = await Bus.find();
    const assignedBus = buses.find((bus) => normalizeName(bus.driver) === userName);

    if (!assignedBus) {
      return res.status(404).json({ message: 'No bus assigned to this driver' });
    }

    res.status(200).json({
      message: 'Assigned bus fetched successfully',
      bus: assignedBus
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
    const updates = {};

    if (typeof passengers === 'number') updates.passengers = passengers;
    if (typeof currentStop === 'string') updates.currentStop = currentStop;
    if (typeof status === 'string') updates.status = status;
    if (typeof latitude === 'number') updates.latitude = latitude;
    if (typeof longitude === 'number') updates.longitude = longitude;

    const bus = await Bus.findOneAndUpdate(
      { busId: req.params.id },
      updates,
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

// ── DRIVER QUICK ACTION: LOG BREAK ──
router.patch('/:id/break', protect, authorizeRole('driver'), async (req, res) => {
  try {
    const bus = await Bus.findOneAndUpdate(
      { busId: req.params.id },
      { status: 'At Stop', lastBreakAt: new Date() },
      { new: true }
    );

    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    res.status(200).json({
      message: 'Break logged successfully',
      bus
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

// ── DRIVER QUICK ACTION: REPORT INCIDENT ──
router.post('/:id/incidents', protect, authorizeRole('driver'), async (req, res) => {
  try {
    const { type, description } = req.body;
    const bus = await Bus.findOneAndUpdate(
      { busId: req.params.id },
      {
        $push: {
          incidents: {
            type: type || 'General',
            description: description || 'Incident reported by driver',
            reportedBy: req.user?.name || 'Driver'
          }
        },
        status: 'Delayed'
      },
      { new: true }
    );

    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    res.status(201).json({
      message: 'Incident reported successfully',
      bus
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

// ── DRIVER QUICK ACTION: END TRIP ──
router.patch('/:id/end-trip', protect, authorizeRole('driver'), async (req, res) => {
  try {
    const bus = await Bus.findOneAndUpdate(
      { busId: req.params.id },
      { status: 'Off Duty', passengers: 0 },
      { new: true }
    );

    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    res.status(200).json({
      message: 'Trip ended successfully',
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