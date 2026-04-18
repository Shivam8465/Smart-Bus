const express        = require('express');
const router         = express.Router();
const Route          = require('../models/Route');
const authMiddleware = require('../middleware/auth');
const protect        = authMiddleware.protect;
const authorizeRole  = authMiddleware.authorizeRole;

// ── GET ALL ROUTES (everyone can see) ──
router.get('/', protect, async (req, res) => {
  try {
    const routes = await Route.find();
    res.status(200).json({
      message: 'Routes fetched successfully',
      count:   routes.length,
      routes
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// ── GET SINGLE ROUTE ──
router.get('/:id', protect, async (req, res) => {
  try {
    const route = await Route.findOne({ routeId: req.params.id });
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }
    res.status(200).json({ message: 'Route found', route });
  } catch (error) {
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// ── ADD NEW ROUTE (Admin only) ──
router.post('/', protect, authorizeRole('admin'), async (req, res) => {
  try {
    const { routeId, name, stops, distance, frequency } = req.body;

    if (!routeId || !name) {
      return res.status(400).json({ 
        message: 'Route ID and name are required' 
      });
    }

    const existing = await Route.findOne({ routeId });
    if (existing) {
      return res.status(400).json({ 
        message: 'Route ID already exists' 
      });
    }

    const newRoute = new Route({
      routeId,
      name,
      stops:      stops      || [],
      totalStops: stops      ? stops.length : 0,
      distance:   distance   || '',
      frequency:  frequency  || ''
    });

    await newRoute.save();

    res.status(201).json({
      message: 'Route added successfully',
      route:   newRoute
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// ── UPDATE ROUTE (Admin only) ──
router.put('/:id', protect, authorizeRole('admin'), async (req, res) => {
  try {
    const route = await Route.findOneAndUpdate(
      { routeId: req.params.id },
      req.body,
      { new: true }
    );

    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    res.status(200).json({
      message: 'Route updated successfully',
      route
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// ── DELETE ROUTE (Admin only) ──
router.delete('/:id', protect, authorizeRole('admin'), async (req, res) => {
  try {
    const route = await Route.findOneAndDelete({ routeId: req.params.id });

    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    res.status(200).json({
      message: `Route ${req.params.id} deleted successfully`
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;