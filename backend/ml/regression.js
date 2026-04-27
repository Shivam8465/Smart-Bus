const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const DATA_PATH = path.join(__dirname, '../data/GTFS_Data.csv');

// We will store our global trained model here
let globalModel = { w1: 0, w2: 0, w3: 0, bias: 0 };
let isTrained = false;

// Helper to convert congestion string to a realistic passenger count
function getPassengersFromCongestion(congestion) {
  const c = (congestion || '').toLowerCase();
  if (c.includes('heavy')) return Math.floor(Math.random() * 15) + 45; // 45-60
  if (c.includes('mild')) return Math.floor(Math.random() * 15) + 30; // 30-45
  if (c.includes('very smooth')) return Math.floor(Math.random() * 10) + 5; // 5-15
  return Math.floor(Math.random() * 15) + 15; // smooth: 15-30
}

// Helper to convert arrival time string (e.g. "09:13:54") to a time period number
function getTimePeriodNum(arrivalTime) {
  if (!arrivalTime) return 2;
  const parts = arrivalTime.split(':');
  if (parts.length < 1) return 2;
  const hour = parseInt(parts[0], 10);
  
  if (hour >= 8 && hour < 11) return 3; // morning peak
  if (hour >= 11 && hour < 16) return 2; // midday
  if (hour >= 16 && hour < 20) return 4; // evening peak
  return 1; // night
}

// Perform the least squares multiple linear regression
function trainRegression(data) {
  const n = data.length;
  if (n === 0) return { w1: 0, w2: 0, w3: 0, bias: 0 };

  const passengers = data.map(d => d.passengers);
  const timePeriodNum = data.map(d => d.timePeriodNum);
  const stopPosition = data.map(d => d.stopPosition);
  const actualETA = data.map(d => d.actualETA);

  const meanP = passengers.reduce((a, b) => a + b) / n;
  const meanT = timePeriodNum.reduce((a, b) => a + b) / n;
  const meanS = stopPosition.reduce((a, b) => a + b) / n;
  const meanETA = actualETA.reduce((a, b) => a + b) / n;

  let numP = 0, numT = 0, numS = 0;
  let denP = 0, denT = 0, denS = 0;

  for (let i = 0; i < n; i++) {
    numP += (passengers[i] - meanP) * (actualETA[i] - meanETA);
    numT += (timePeriodNum[i] - meanT) * (actualETA[i] - meanETA);
    numS += (stopPosition[i] - meanS) * (actualETA[i] - meanETA);
    denP += (passengers[i] - meanP) ** 2;
    denT += (timePeriodNum[i] - meanT) ** 2;
    denS += (stopPosition[i] - meanS) ** 2;
  }

  // Prevent divide by zero
  denP = denP === 0 ? 1 : denP;
  denT = denT === 0 ? 1 : denT;
  denS = denS === 0 ? 1 : denS;

  const w1 = numP / denP;
  const w2 = numT / denT;
  const w3 = numS / denS;
  const bias = meanETA - (w1 * meanP) - (w2 * meanT) - (w3 * meanS);

  return { w1, w2, w3, bias, sampleSize: n };
}

// Load CSV and train model
function initModel() {
  return new Promise((resolve, reject) => {
    const trainingData = [];
    
    console.log('Loading dataset for ML training from:', DATA_PATH);
    if (!fs.existsSync(DATA_PATH)) {
      console.warn('GTFS_Data.csv not found! Using fallback model.');
      globalModel = { w1: 0.15, w2: 1.2, w3: -1.5, bias: 20, sampleSize: 0 };
      isTrained = true;
      return resolve(globalModel);
    }

    fs.createReadStream(DATA_PATH)
      .pipe(csv())
      .on('data', (row) => {
        // Parse the row from Kaggle GTFS dataset into features
        const passengers = getPassengersFromCongestion(row.Degree_of_congestion);
        const timePeriodNum = getTimePeriodNum(row.arrival_time);
        
        // Derive a pseudo stop position based on stop ID to simulate sequence (1 to 20)
        const stopId = parseInt(row.stop_id_from, 10) || Math.floor(Math.random() * 20);
        const stopPosition = (stopId % 20) + 1;
        
        // Target: row.time is segment travel time in hours.
        // Convert to minutes, and multiply by remaining stops to estimate total ETA.
        const segmentTimeHours = parseFloat(row.time) || 0.03;
        const remainingStops = 21 - stopPosition;
        const actualETA = segmentTimeHours * 60 * remainingStops;
        
        if (actualETA > 0 && actualETA < 120) { // filter out extreme outliers
          trainingData.push({
            passengers,
            timePeriodNum,
            stopPosition,
            actualETA
          });
        }
      })
      .on('end', () => {
        console.log(`Successfully parsed ${trainingData.length} records from CSV.`);
        globalModel = trainRegression(trainingData);
        isTrained = true;
        console.log('Model trained successfully!', globalModel);
        resolve(globalModel);
      })
      .on('error', (err) => {
        console.error('Error reading CSV:', err);
        reject(err);
      });
  });
}

// Prediction function exported for API use
function predict(route, timePeriodNum, stopPosition, currentPassengers, hasLiveDriver = false) {
  if (!isTrained) {
    console.warn('Model not yet trained. Returning default prediction.');
  }

  const w1 = globalModel.w1 || 0.15;
  const w2 = globalModel.w2 || 1.2;
  const w3 = globalModel.w3 || -1.5;
  const bias = globalModel.bias || 20;

  // ETA = (w1 × passengers) + (w2 × timePeriod) + (w3 × stopPosition) + bias
  const predictedETA = Math.round(
    (w1 * currentPassengers) +
    (w2 * timePeriodNum) +
    (w3 * stopPosition) +
    bias
  );

  // Constrain between 2 and 90 mins
  const finalETA = Math.min(90, Math.max(2, predictedETA));
  
  const crowdPct = Math.min(98, Math.max(5, Math.round((currentPassengers / 60) * 100)));
  const crowdLevel = crowdPct > 75 ? 'high' : crowdPct > 45 ? 'medium' : 'low';
  
  // Calculate confidence based on sample size and live driver status
  let baseConfidence = 75;
  if (globalModel.sampleSize > 1000) {
    // If we have a massive dataset, base confidence is high
    baseConfidence = 85; 
  }
  
  // If we are getting live updates from a driver, we are highly confident
  if (hasLiveDriver) {
    baseConfidence += 10;
  } else {
    // Without a live driver, we lose some confidence
    baseConfidence -= 5;
  }
  
  // Add slight random noise to confidence for realism
  const confidence = Math.min(98, baseConfidence + Math.floor(Math.random() * 5));

  return {
    arrivalTime: finalETA,
    crowdPercentage: crowdPct,
    crowdLevel: crowdLevel,
    confidence: confidence,
    factors: {
      passengers: currentPassengers,
      w1: w1,
      timePeriodNum: timePeriodNum,
      w2: w2,
      stopPosition: stopPosition,
      w3: w3,
      bias: bias,
      sampleSize: globalModel.sampleSize || 0
    }
  };
}

module.exports = {
  initModel,
  predict
};
