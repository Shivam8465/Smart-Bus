const express        = require('express');
const router         = express.Router();
const Bus            = require('../models/Bus');
const Route          = require('../models/Route');
const User           = require('../models/User');
const authMiddleware = require('../middleware/auth');
const protect        = authMiddleware.protect;
const authorizeRole  = authMiddleware.authorizeRole;

function normalizeName(value = '') {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeStop(value = '') {
  return value.trim().toLowerCase().replace(/\s+/g, ' ').replace(' stop', '');
}

function normalizeRouteCode(value = '') {
  return value.trim().toUpperCase().replace(/^RT-/, '');
}

async function calculateBusEta(busLike) {
  const status = busLike.status || 'On Route';
  if (status === 'Off Duty') return '—';

  const routeCode = normalizeRouteCode(busLike.route || '');
  let routeDoc = null;
  if (routeCode) {
    routeDoc = await Route.findOne({
      $or: [
        { routeId: `RT-${routeCode}` },
        { routeId: routeCode },
        { name: new RegExp(routeCode, 'i') }
      ]
    });
  }

  const stops = routeDoc?.stops || [];
  const currentStop = busLike.currentStop || '';
  const normalizedCurrent = normalizeStop(currentStop);
  const currentIndex = stops.findIndex((stop) => normalizeStop(stop.name) === normalizedCurrent);

  const remainingStops = currentIndex >= 0
    ? Math.max(0, stops.length - currentIndex - 1)
    : Math.max(1, stops.length || 3);

  const baseMinutes = Math.max(2, remainingStops * 3);
  const passengers = Number(busLike.passengers || 0);
  const capacity = Number(busLike.capacity || 50);
  const occupancy = capacity > 0 ? passengers / capacity : 0;

  const occupancyPenalty = occupancy > 0.85 ? 3 : occupancy > 0.65 ? 2 : occupancy > 0.45 ? 1 : 0;
  const statusPenalty = status === 'Delayed' ? 5 : status === 'At Stop' ? 1 : 0;

  const etaMinutes = Math.min(45, Math.max(2, Math.round(baseMinutes + occupancyPenalty + statusPenalty)));
  return `${etaMinutes} min`;
}

async function validateRouteAssignment(routeInput) {
  const input = (routeInput || '').trim();
  if (!input || input.toLowerCase() === 'unassigned' || input.toLowerCase() === 'none') {
    return { ok: true, normalizedRoute: 'Unassigned' };
  }

  const routeCode = normalizeRouteCode(input);
  const routeDoc = await Route.findOne({
    $or: [
      { routeId: `RT-${routeCode}` },
      { routeId: routeCode },
      { name: new RegExp(`^${routeCode}`, 'i') }
    ]
  });

  if (!routeDoc) {
    return { ok: false, status: 400, message: `Route '${input}' does not exist. Please use a valid route.` };
  }

  return { ok: true, normalizedRoute: normalizeRouteCode(routeDoc.routeId) };
}

async function validateDriverAssignment(driverName, busIdToIgnore = null) {
  const normalizedDriver = normalizeName(driverName || '');
  if (!normalizedDriver) {
    return { ok: false, status: 400, message: 'Driver name is required' };
  }

  const driverUser = await User.findOne({ role: 'driver' });
  const matchingDriver = driverUser
    ? await User.findOne({
        role: 'driver',
        name: new RegExp(`^${(driverName || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
      })
    : null;

  if (!matchingDriver) {
    return {
      ok: false,
      status: 400,
      message: 'Assigned driver must be a registered driver account'
    };
  }

  const assignedBus = await Bus.findOne({
    driver: new RegExp(`^${(driverName || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
  });

  if (assignedBus && assignedBus.busId !== busIdToIgnore) {
    return {
      ok: false,
      status: 400,
      message: `Driver ${matchingDriver.name} is already assigned to ${assignedBus.busId}`
    };
  }

  return { ok: true, normalizedName: matchingDriver.name };
}

// ── GET ALL BUSES (Public, Passenger and Admin can see) ──
router.get('/', async (req, res) => {
  try {
    const buses = await Bus.find();
    
    // Find unassigned drivers and append them as virtual buses
    const drivers = await User.find({ role: 'driver' });
    const assignedDriverNames = new Set(buses.map(b => normalizeName(b.driver)));
    
    const unassignedDrivers = drivers.filter(d => !assignedDriverNames.has(normalizeName(d.name)));
    const virtualBuses = unassignedDrivers.map(d => ({
      busId: `UNASSIGNED-${d._id}`,
      route: 'None',
      driver: d.name,
      status: 'Off Duty',
      passengers: 0,
      capacity: 50,
      eta: '—',
      isVirtual: true
    }));

    const combined = [...buses, ...virtualBuses];

    res.status(200).json({
      message: 'Buses fetched successfully',
      count:   combined.length,
      buses:   combined
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

    const driverValidation = await validateDriverAssignment(driver);
    if (!driverValidation.ok) {
      return res.status(driverValidation.status).json({ message: driverValidation.message });
    }

    const routeValidation = await validateRouteAssignment(route);
    if (!routeValidation.ok) {
      return res.status(routeValidation.status).json({ message: routeValidation.message });
    }

    const newBus = new Bus({
      busId,
      route: routeValidation.normalizedRoute,
      driver: driverValidation.normalizedName,
      capacity: capacity || 50
    });
    newBus.eta = await calculateBusEta(newBus);

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
    const existingBus = await Bus.findOne({ busId: req.params.id });
    if (!existingBus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    const merged = { ...existingBus.toObject(), ...req.body };
    const nextDriverName = (req.body.driver || existingBus.driver || '').trim();
    const driverValidation = await validateDriverAssignment(nextDriverName, req.params.id);
    if (!driverValidation.ok) {
      return res.status(driverValidation.status).json({ message: driverValidation.message });
    }
    merged.driver = driverValidation.normalizedName;
    const routeValidation = await validateRouteAssignment(req.body.route || existingBus.route);
    if (!routeValidation.ok) {
      return res.status(routeValidation.status).json({ message: routeValidation.message });
    }
    merged.route = routeValidation.normalizedRoute;
    const eta = await calculateBusEta(merged);

    const bus = await Bus.findOneAndUpdate(
      { busId: req.params.id },
      { ...req.body, driver: driverValidation.normalizedName, route: routeValidation.normalizedRoute, eta },
      { returnDocument: 'after' }
    );

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

    const existingBus = await Bus.findOne({ busId: req.params.id });
    if (!existingBus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    const merged = { ...existingBus.toObject(), ...updates };
    updates.eta = await calculateBusEta(merged);
    updates.lastLocationAt = new Date();

    const bus = await Bus.findOneAndUpdate(
      { busId: req.params.id },
      updates,
      { returnDocument: 'after' }
    );

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
      { returnDocument: 'after' }
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
      { returnDocument: 'after' }
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
      { returnDocument: 'after' }
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
    if (req.params.id.startsWith('UNASSIGNED-')) {
      const userId = req.params.id.replace('UNASSIGNED-', '');
      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        return res.status(404).json({ message: 'Driver account not found' });
      }
      return res.status(200).json({
        message: `Driver account ${user.name} deleted successfully`
      });
    }

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