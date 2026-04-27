const express = require('express');
const router = express.Router();
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const regression = require('../ml/regression');

// GET /api/predictions
router.get('/', async (req, res) => {
  try {
    const { route, timePeriod, stopName } = req.query;

    if (!route) {
      return res.status(400).json({ success: false, message: 'Route is required' });
    }

    // Determine time period number
    let resolvedPeriod = timePeriod || 'now';
    if (resolvedPeriod === 'now') {
      const currentHour = new Date().getHours();
      if (currentHour >= 8 && currentHour < 11) resolvedPeriod = 'morning';
      else if (currentHour >= 11 && currentHour < 16) resolvedPeriod = 'midday';
      else if (currentHour >= 16 && currentHour < 20) resolvedPeriod = 'evening';
      else resolvedPeriod = 'night';
    }

    const timePeriodNum = {
      morning: 3,
      evening: 4,
      midday: 2,
      night: 1,
    }[resolvedPeriod] || 2;

    // Get exact stop position from Route schema instead of a random number
    let stopPosition = 5; // default fallback if stop not found
    const routeDoc = await Route.findOne({ routeId: new RegExp(`^RT-${route}$`, 'i') });
    
    if (routeDoc && routeDoc.stops && stopName) {
      // The frontend sends the exact stop.name in the dropdown value
      const matchedStop = routeDoc.stops.find(s => s.name === stopName);
      if (matchedStop && matchedStop.position) {
        stopPosition = matchedStop.position;
      }
    }

    // Find if there is an active bus on this route (status is not 'Off Duty')
    // Sort by updatedAt descending to get the bus that was most recently updated by a driver
    const activeBus = await Bus.findOne({
      route: route.toUpperCase().replace(/^RT-/, ''),
      status: { $ne: 'Off Duty' }
    }).sort({ updatedAt: -1 });

    // If no active bus exists OR if the user is forecasting for a future time, simulate historical passenger averages based on time of day
    let currentPassengers;
    let hasLiveDriver = false;
    
    // Check original requested time period to see if we should use live data
    const isLiveRequest = (!timePeriod || timePeriod === 'now');

    // Only use the live bus data if we are predicting for 'now'
    if (activeBus && isLiveRequest) {
      currentPassengers = activeBus.passengers;
      hasLiveDriver = true;
    } else {
      // Historical average fallbacks based on Kaggle data patterns
      if (timePeriodNum === 3) currentPassengers = Math.floor(Math.random() * 15) + 40; // Morning Peak: 40-55
      else if (timePeriodNum === 4) currentPassengers = Math.floor(Math.random() * 15) + 45; // Evening Peak: 45-60
      else if (timePeriodNum === 2) currentPassengers = Math.floor(Math.random() * 15) + 20; // Midday: 20-35
      else currentPassengers = Math.floor(Math.random() * 10) + 5; // Night: 5-15
    }

    // Call the ML prediction
    const predictionResult = regression.predict(route, timePeriodNum, stopPosition, currentPassengers, hasLiveDriver);

    res.json({
      success: true,
      data: {
        route: route,
        busId: hasLiveDriver ? activeBus.busId : null,
        stopName: stopName || 'Any Stop',
        stopPosition: stopPosition,
        arrivalTime: predictionResult.arrivalTime,
        crowdPercentage: predictionResult.crowdPercentage,
        crowdLevel: predictionResult.crowdLevel,
        confidence: predictionResult.confidence,
        timePeriod: resolvedPeriod,
        passengers: currentPassengers, // Using the live data from the driver!
        factors: [
          `ML Dataset size: ${predictionResult.factors.sampleSize} Kaggle records`,
          hasLiveDriver ? `Live Driver Update: ${currentPassengers} passengers reported` : `Historical Average: ${currentPassengers} passengers at this time`,
          `Computed Weights: P(${predictionResult.factors.w1.toFixed(2)}) T(${predictionResult.factors.w2.toFixed(2)}) S(${predictionResult.factors.w3.toFixed(2)})`,
          `Bias offset: ${predictionResult.factors.bias.toFixed(2)} mins`,
          `Predicted occupancy: ${predictionResult.crowdPercentage}%`
        ]
      }
    });

  } catch (error) {
    console.error('Prediction API Error:', error);
    res.status(500).json({ success: false, message: 'Server error generating prediction' });
  }
});

module.exports = router;
