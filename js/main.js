// ── Shared nav active state ──
document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .sidebar-menu a').forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });
});

// ── Dummy Data ──
const DUMMY = {
  buses: [
    { id:'BUS-001', route:'42A', driver:'Rajesh Kumar',    status:'On Route', passengers:34, capacity:50, eta:'4 min'  },
    { id:'BUS-002', route:'17B', driver:'Amit Singh',      status:'On Route', passengers:18, capacity:45, eta:'11 min' },
    { id:'BUS-003', route:'08C', driver:'Manoj Patel',     status:'Delayed',  passengers:41, capacity:50, eta:'19 min' },
    { id:'BUS-004', route:'25D', driver:'Suresh Rao',      status:'At Stop',  passengers:7,  capacity:45, eta:'—'      },
    { id:'BUS-005', route:'33E', driver:'Pradeep Nair',    status:'On Route', passengers:29, capacity:50, eta:'7 min'  },
    { id:'BUS-006', route:'42A', driver:'Vikram Sharma',   status:'At Stop',  passengers:45, capacity:50, eta:'2 min'  },
    { id:'BUS-007', route:'17B', driver:'Deepak Verma',    status:'On Route', passengers:22, capacity:45, eta:'15 min' },
    { id:'BUS-008', route:'08C', driver:'Ravi Gupta',      status:'On Route', passengers:38, capacity:50, eta:'8 min'  },
    { id:'BUS-009', route:'55F', driver:'Ankit Mishra',    status:'On Route', passengers:31, capacity:50, eta:'6 min'  },
    { id:'BUS-010', route:'62B', driver:'Sanjay Tiwari',   status:'Delayed',  passengers:44, capacity:50, eta:'22 min' },
    { id:'BUS-011', route:'55F', driver:'Rahul Dubey',     status:'On Route', passengers:15, capacity:45, eta:'9 min'  },
    { id:'BUS-012', route:'33E', driver:'Mohit Yadav',     status:'At Stop',  passengers:28, capacity:50, eta:'—'      },
    { id:'BUS-013', route:'62B', driver:'Arun Pandey',     status:'On Route', passengers:37, capacity:50, eta:'13 min' },
    { id:'BUS-014', route:'25D', driver:'Nitin Joshi',     status:'On Route', passengers:11, capacity:45, eta:'18 min' },
    { id:'BUS-015', route:'42A', driver:'Kiran Mehta',     status:'On Route', passengers:42, capacity:50, eta:'5 min'  },
  ],

  routes: [
    { id:'RT-42A', name:'City Centre → Airport',          stops:9,  distance:'18 km', freq:'15 min' },
    { id:'RT-17B', name:'North Station → University',     stops:5,  distance:'11 km', freq:'20 min' },
    { id:'RT-08C', name:'East Mall → West Terminal',      stops:6,  distance:'22 km', freq:'10 min' },
    { id:'RT-25D', name:'South Bay → Central Park',       stops:3,  distance:'8 km',  freq:'30 min' },
    { id:'RT-33E', name:'Depot → Tech Park',              stops:3,  distance:'6 km',  freq:'25 min' },
    { id:'RT-55F', name:'Old Delhi → Connaught Place',    stops:11, distance:'14 km', freq:'12 min' },
    { id:'RT-62B', name:'Dwarka → Nehru Place',           stops:8,  distance:'19 km', freq:'18 min' },
    { id:'RT-71C', name:'Rohini → Kashmere Gate',         stops:13, distance:'21 km', freq:'15 min' },
  ],

  drivers: [
    { id:'DRV-001', name:'Rajesh Kumar',  license:'DL-2318764', route:'42A', shift:'06:00-14:00', status:'On Duty'  },
    { id:'DRV-002', name:'Amit Singh',    license:'DL-1829473', route:'17B', shift:'06:00-14:00', status:'On Duty'  },
    { id:'DRV-003', name:'Manoj Patel',   license:'DL-9274651', route:'08C', shift:'14:00-22:00', status:'On Duty'  },
    { id:'DRV-004', name:'Suresh Rao',    license:'DL-3847291', route:'25D', shift:'14:00-22:00', status:'On Duty'  },
    { id:'DRV-005', name:'Pradeep Nair',  license:'DL-6152837', route:'33E', shift:'22:00-06:00', status:'On Duty'  },
    { id:'DRV-006', name:'Vikram Sharma', license:'DL-7364829', route:'42A', shift:'06:00-14:00', status:'On Duty'  },
    { id:'DRV-007', name:'Deepak Verma',  license:'DL-2847361', route:'17B', shift:'14:00-22:00', status:'On Break' },
    { id:'DRV-008', name:'Ravi Gupta',    license:'DL-9182736', route:'08C', shift:'06:00-14:00', status:'On Duty'  },
    { id:'DRV-009', name:'Ankit Mishra',  license:'DL-4729183', route:'55F', shift:'14:00-22:00', status:'On Duty'  },
    { id:'DRV-010', name:'Sanjay Tiwari', license:'DL-8374619', route:'62B', shift:'06:00-14:00', status:'On Duty'  },
    { id:'DRV-011', name:'Rahul Dubey',   license:'DL-1637284', route:'55F', shift:'22:00-06:00', status:'On Duty'  },
    { id:'DRV-012', name:'Mohit Yadav',   license:'DL-5928374', route:'33E', shift:'06:00-14:00', status:'Off Duty' },
    { id:'DRV-013', name:'Arun Pandey',   license:'DL-3748291', route:'62B', shift:'14:00-22:00', status:'On Duty'  },
    { id:'DRV-014', name:'Nitin Joshi',   license:'DL-8291736', route:'25D', shift:'06:00-14:00', status:'On Duty'  },
    { id:'DRV-015', name:'Kiran Mehta',   license:'DL-6473829', route:'42A', shift:'22:00-06:00', status:'On Duty'  },
  ],

  predictions: [
    { route:'42A', stop:'Main Street',     eta:'4 min',  crowd:'medium', crowdPct:68 },
    { route:'17B', stop:'Park Avenue',     eta:'11 min', crowd:'low',    crowdPct:40 },
    { route:'08C', stop:'Central Station', eta:'19 min', crowd:'high',   crowdPct:92 },
    { route:'33E', stop:'Tech Park',       eta:'7 min',  crowd:'medium', crowdPct:58 },
    { route:'55F', stop:'Connaught Place', eta:'6 min',  crowd:'high',   crowdPct:88 },
    { route:'62B', stop:'Nehru Place',     eta:'13 min', crowd:'medium', crowdPct:74 },
  ],

  stats: {
    totalBuses:      24,
    activeRoutes:    8,
    passengersToday: 8472,
    onTimeRate:      '84%',
  }
};

// ── ROUTE STOP DATA ──
// Each stop has a position (1 = first, 12 = last)
// and a distance from the depot in km
// This affects ETA calculation

const ROUTE_STOPS = {
  '42A': [
    { name: 'City Centre Depot',  position: 1,  distanceKm: 0  },
    { name: 'North Gate',         position: 2,  distanceKm: 2  },
    { name: 'Main Street',        position: 3,  distanceKm: 4  },
    { name: 'Central Station',    position: 4,  distanceKm: 6  },
    { name: 'Park Avenue Stop',   position: 5,  distanceKm: 8  },
    { name: 'Tech Park',          position: 6,  distanceKm: 10 },
    { name: 'South Bay',          position: 7,  distanceKm: 12 },
    { name: 'Airport Road',       position: 8,  distanceKm: 15 },
    { name: 'Airport Terminal',   position: 9,  distanceKm: 18 },
  ],
  '17B': [
    { name: 'North Station',      position: 1,  distanceKm: 0  },
    { name: 'Park Avenue',        position: 2,  distanceKm: 2  },
    { name: 'Central Station',    position: 3,  distanceKm: 4  },
    { name: 'East Mall',          position: 4,  distanceKm: 6  },
    { name: 'University Campus',  position: 5,  distanceKm: 11 },
  ],
  '08C': [
    { name: 'East Mall',          position: 1,  distanceKm: 0  },
    { name: 'Main Street',        position: 2,  distanceKm: 3  },
    { name: 'Central Station',    position: 3,  distanceKm: 6  },
    { name: 'Park Avenue',        position: 4,  distanceKm: 9  },
    { name: 'South Bay',          position: 5,  distanceKm: 13 },
    { name: 'West Terminal',      position: 6,  distanceKm: 22 },
  ],
  '25D': [
    { name: 'South Bay',          position: 1,  distanceKm: 0  },
    { name: 'Tech Park',          position: 2,  distanceKm: 3  },
    { name: 'Central Park',       position: 3,  distanceKm: 8  },
  ],
  '33E': [
    { name: 'Depot',              position: 1,  distanceKm: 0  },
    { name: 'North Gate',         position: 2,  distanceKm: 2  },
    { name: 'Tech Park Gate',     position: 3,  distanceKm: 6  },
  ]
};

// ── Crowd Level Helper ──
function getCrowdBadgeClass(level) {
  return { low: 'badge-green', medium: 'badge-amber', high: 'badge-red' }[level] || 'badge-blue';
}
function getCrowdLabel(level) {
  return { low: 'LOW', medium: 'MEDIUM', high: 'HIGH' }[level] || level.toUpperCase();
}

// ── Format ETA ──
function formatETA(min) {
  if (min === '—') return '—';
  return min;
}

// ── Simulate live update tick ──
function startLiveTick(selector, min, max) {
  const el = document.querySelector(selector);
  if (!el) return;
  setInterval(() => {
    el.textContent = Math.floor(Math.random() * (max - min + 1) + min);
  }, 5000);
}
// ── AUTH FUNCTIONS ──

// Call this at top of every dashboard page
function requireLogin(requiredRole) {
  const user = getLoggedInUser();
  
  // Not logged in at all
  if (!user) {
    window.location.href = '../pages/login.html';
    return null;
  }

  // Logged in but wrong role
  if (requiredRole && user.role !== requiredRole) {
    // Redirect them to their correct dashboard
    const correctPage = {
      passenger: '../pages/passenger.html',
      driver:    '../pages/driver.html',
      admin:     '../pages/admin.html'
    }[user.role];

    // Show message before redirecting
    alert(`Access denied. You are logged in as ${user.role}. Redirecting to your dashboard.`);
    window.location.href = correctPage;
    return null;
  }

  return user;
}

// Get the logged in user object
function getLoggedInUser() {
  const data = localStorage.getItem('sbf_user');
  if (!data) return null;
  return JSON.parse(data);
}

// Get just the role
function getLoggedInRole() {
  return localStorage.getItem('sbf_role');
}

// Logout - clear everything and go to login
function logout() {
  localStorage.removeItem('sbf_user');
  localStorage.removeItem('sbf_role');
  window.location.href = '../pages/login.html';
}
// ── HISTORICAL TRIP DATA GENERATOR ──

// ── HISTORICAL TRIP DATA GENERATOR ──

function generateHistoricalData() {
  const data = [];

  // Rules that reflect real world patterns
  // These are what the regression will learn from
  const patterns = {
    morning: { passengerMin: 35, passengerMax: 50, etaMultiplier: 1.4 },
    midday:  { passengerMin: 15, passengerMax: 30, etaMultiplier: 0.9 },
    evening: { passengerMin: 38, passengerMax: 50, etaMultiplier: 1.5 },
    night:   { passengerMin: 5,  passengerMax: 20, etaMultiplier: 0.7 }
  };

  const routes    = ['42A', '17B', '08C', '25D', '33E'];
  const baseTimes = { 
    '42A': 8, '17B': 12, '08C': 15, '25D': 10, '33E': 6 
  };
  const timePeriods = ['morning', 'midday', 'evening', 'night'];
  const dayTypes    = ['weekday', 'weekday', 'weekday', 'weekend'];
  // weekday appears 3 times so it generates more weekday records
  // reflecting real world where weekdays are more common

  // Generate 50 records per route = 250 total records
  routes.forEach(route => {
    for (let i = 0; i < 50; i++) {

      // Pick random time period and day type
      const timePeriod = timePeriods[
        Math.floor(Math.random() * timePeriods.length)
      ];
      const dayType = dayTypes[
        Math.floor(Math.random() * dayTypes.length)
      ];

      const pattern = patterns[timePeriod];

      // Generate realistic passenger count for this time period
      const passengers = Math.floor(
        Math.random() *
        (pattern.passengerMax - pattern.passengerMin) +
        pattern.passengerMin
      );

      // Calculate realistic ETA based on:
      // base time × time multiplier + passenger effect + small noise
      const passengerEffect = passengers * 0.08;
      const noise           = (Math.random() * 2) - 1; // -1 to +1 minutes
      const actualETA       = Math.round(
        baseTimes[route] * pattern.etaMultiplier +
        passengerEffect +
        noise
      );

      // Convert time period to number for regression
      // Regression needs numbers not strings
      const timePeriodNum = {
        morning: 3,  // highest delay
        evening: 4,  // highest delay
        midday:  2,  // moderate
        night:   1   // lowest delay
      }[timePeriod];

      // Weekend slightly less crowded
      const dayMultiplier = dayType === 'weekend' ? 0.85 : 1.0;

      // Pick a random stop from this route
      const routeStops  = ROUTE_STOPS[route] ||
                          [{ position: 1, distanceKm: 5 }];
      const randomStop  = routeStops[
        Math.floor(Math.random() * routeStops.length)
      ];

      data.push({
        route:         route,
        timePeriod:    timePeriod,
        timePeriodNum: timePeriodNum,
        dayType:       dayType,
        dayMultiplier: dayMultiplier,
        passengers:    Math.round(passengers * dayMultiplier),
        actualETA:     actualETA + (randomStop.position * 0.5),
        // stop position adds time — later stops wait longer
        stopPosition:  randomStop.position,
        distanceKm:    randomStop.distanceKm,
        crowdLevel:    passengers > 35 ? 'high' :
                       passengers > 20 ? 'medium' : 'low'
      });
    }
  });

  return data;
}

// Generate and store the data once
const HISTORICAL_DATA = generateHistoricalData();
// ── LINEAR REGRESSION ENGINE ──

function trainRegression(data) {
  // Now using THREE independent variables
  // ETA = (w1 × passengers) + (w2 × timePeriodNum) 
  //       + (w3 × stopPosition) + bias
  //
  // w3 captures how stop position affects waiting time
  // Later stops on a route have longer ETAs

  const n = data.length;

  const passengers    = data.map(d => d.passengers);
  const timePeriodNum = data.map(d => d.timePeriodNum);
  const stopPosition  = data.map(d => d.stopPosition || 1);
  const actualETA     = data.map(d => d.actualETA);

  // Calculate means
  const meanP    = passengers.reduce((a, b) => a + b) / n;
  const meanT    = timePeriodNum.reduce((a, b) => a + b) / n;
  const meanS    = stopPosition.reduce((a, b) => a + b) / n;
  const meanETA  = actualETA.reduce((a, b) => a + b) / n;

  // Calculate weights using least squares
  let numP = 0, numT = 0, numS = 0;
  let denP = 0, denT = 0, denS = 0;

  for (let i = 0; i < n; i++) {
    numP += (passengers[i]    - meanP) * (actualETA[i] - meanETA);
    numT += (timePeriodNum[i] - meanT) * (actualETA[i] - meanETA);
    numS += (stopPosition[i]  - meanS) * (actualETA[i] - meanETA);
    denP += (passengers[i]    - meanP) ** 2;
    denT += (timePeriodNum[i] - meanT) ** 2;
    denS += (stopPosition[i]  - meanS) ** 2;
  }

  const w1   = numP / denP; // passenger weight
  const w2   = numT / denT; // time of day weight
  const w3   = numS / denS; // stop position weight
  const bias = meanETA - (w1 * meanP) - (w2 * meanT) - (w3 * meanS);

  return { w1, w2, w3, bias };
}

// Train one model per route
// Each route has different patterns so each gets its own model
function trainAllModels() {
  const models = {};
  const routes = ['42A', '17B', '08C', '25D', '33E'];

  routes.forEach(route => {
    // Filter historical data for just this route
    const routeData = HISTORICAL_DATA.filter(d => d.route === route);
    models[route] = trainRegression(routeData);
  });

  // Also train a general model for unknown routes
  models['general'] = trainRegression(HISTORICAL_DATA);

  return models;
}

// Train models immediately when page loads
const TRAINED_MODELS = trainAllModels();
// ── PREDICTION FUNCTION ──

function predictWithRegression(route, timePeriod, stopName) {

  const model = TRAINED_MODELS[route] || TRAINED_MODELS['general'];

  // Get stop position from stop name
  const routeStops    = ROUTE_STOPS[route] || [];
  const selectedStop  = routeStops.find(s => s.name === stopName);
  const stopPosition  = selectedStop ? selectedStop.position : 1;

 // If 'now' is selected, detect actual current time
let resolvedPeriod = timePeriod;
if (timePeriod === 'now') {
  const currentHour = new Date().getHours();
  if      (currentHour >= 8  && currentHour < 10) resolvedPeriod = 'morning';
  else if (currentHour >= 10 && currentHour < 17) resolvedPeriod = 'midday';
  else if (currentHour >= 17 && currentHour < 21) resolvedPeriod = 'evening';
  else                                             resolvedPeriod = 'night';
}

const timePeriodNum = {
  morning: 3,
  evening: 4,
  midday:  2,
  night:   1,
}[resolvedPeriod] || 2;

  // Get average passengers from historical data
  const routeRecords = HISTORICAL_DATA.filter(
    d => d.route === route && d.timePeriod === timePeriod
  );
  const passengers = routeRecords.length > 0
    ? Math.round(
        routeRecords.reduce((sum, d) => sum + d.passengers, 0) / 
        routeRecords.length
      )
    : 25;

  // Apply multiple regression formula
  // ETA = (w1 × passengers) + (w2 × timeIndex) 
  //       + (w3 × stopPosition) + bias
  const predictedETA = Math.round(
    (model.w1 * passengers) +
    (model.w2 * timePeriodNum) +
    (model.w3 * stopPosition) +
    model.bias
  );

  const finalETA      = Math.min(45, Math.max(2, predictedETA));
  const crowdPct      = Math.min(98, Math.max(5,
    Math.round((passengers / 50) * 100)
  ));
  const crowdLevel    = crowdPct > 75 ? 'high'   :
                        crowdPct > 45 ? 'medium' : 'low';
  const confidence    = Math.min(96,
    70 + (routeRecords.length * 0.4)
  );

  const routeNames = {
    '42A': 'City Centre → Airport',
    '17B': 'North Station → University',
    '08C': 'East Mall → West Terminal',
    '25D': 'South Bay → Central Park',
    '33E': 'Depot → Tech Park'
  };

  return {
    route:           route,
    routeName:       routeNames[route] || `Route ${route}`,
    stopName:        stopName || 'Any Stop',
    stopPosition:    stopPosition,
    arrivalTime:     finalETA,
    crowdPercentage: crowdPct,
    crowdLevel:      crowdLevel,
    confidence:      Math.round(confidence),
    timePeriod:      timePeriod,
    passengers:      passengers,
    factors: [
      `Historical records: ${routeRecords.length} trips`,
      `Formula: ETA = (${model.w1.toFixed(2)} × passengers) + (${model.w2.toFixed(2)} × timeIndex) + (${model.w3.toFixed(2)} × stopPosition) + ${model.bias.toFixed(2)}`,
      `Stop position on route: ${stopPosition}`,
      `Avg passengers at this time: ${passengers} / 50`,
      `Predicted occupancy: ${crowdPct}%`
    ]
  };
}