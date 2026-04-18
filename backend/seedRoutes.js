const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Route = require('./models/Route');

dotenv.config();

const routes = [
  {
    routeId: 'RT-42A',
    name: '42A — City Centre → Airport',
    distance: '18 km',
    frequency: '15 min',
    status: 'Active',
    stops: [
      { name: 'City Centre Depot', position: 1, distanceKm: 0 },
      { name: 'North Gate', position: 2, distanceKm: 2 },
      { name: 'Main Street', position: 3, distanceKm: 4 },
      { name: 'Central Station', position: 4, distanceKm: 6 },
      { name: 'Park Avenue Stop', position: 5, distanceKm: 8 },
      { name: 'Tech Park', position: 6, distanceKm: 10 },
      { name: 'South Bay', position: 7, distanceKm: 12 },
      { name: 'Airport Road', position: 8, distanceKm: 15 },
      { name: 'Airport Terminal', position: 9, distanceKm: 18 }
    ]
  },
  {
    routeId: 'RT-17B',
    name: '17B — North Station → University',
    distance: '11 km',
    frequency: '20 min',
    status: 'Active',
    stops: [
      { name: 'North Station', position: 1, distanceKm: 0 },
      { name: 'Park Avenue', position: 2, distanceKm: 2 },
      { name: 'Central Station', position: 3, distanceKm: 4 },
      { name: 'East Mall', position: 4, distanceKm: 6 },
      { name: 'University Campus', position: 5, distanceKm: 11 }
    ]
  },
  {
    routeId: 'RT-08C',
    name: '08C — East Mall → West Terminal',
    distance: '22 km',
    frequency: '10 min',
    status: 'Active',
    stops: [
      { name: 'East Mall', position: 1, distanceKm: 0 },
      { name: 'Main Street', position: 2, distanceKm: 3 },
      { name: 'Central Station', position: 3, distanceKm: 6 },
      { name: 'Park Avenue', position: 4, distanceKm: 9 },
      { name: 'South Bay', position: 5, distanceKm: 13 },
      { name: 'West Terminal', position: 6, distanceKm: 22 }
    ]
  },
  {
    routeId: 'RT-25D',
    name: '25D — South Bay → Central Park',
    distance: '8 km',
    frequency: '30 min',
    status: 'Active',
    stops: [
      { name: 'South Bay', position: 1, distanceKm: 0 },
      { name: 'Tech Park', position: 2, distanceKm: 3 },
      { name: 'Central Park', position: 3, distanceKm: 8 }
    ]
  },
  {
    routeId: 'RT-33E',
    name: '33E — Depot → Tech Park',
    distance: '6 km',
    frequency: '25 min',
    status: 'Active',
    stops: [
      { name: 'Depot', position: 1, distanceKm: 0 },
      { name: 'North Gate', position: 2, distanceKm: 2 },
      { name: 'Tech Park Gate', position: 3, distanceKm: 6 }
    ]
  }
];

async function seedRoutes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    const records = routes.map((route) => ({
      ...route,
      totalStops: route.stops.length
    }));

    for (const route of records) {
      await Route.updateOne(
        { routeId: route.routeId },
        { $set: route },
        { upsert: true }
      );
    }

    console.log(`${records.length} seed routes upserted (custom routes preserved)`);

    await mongoose.connection.close();
    console.log('Done. Connection closed.');
  } catch (error) {
    console.log('Error:', error.message);
    process.exit(1);
  }
}

seedRoutes();
