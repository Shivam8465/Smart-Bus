const mongoose = require('mongoose');
const dotenv   = require('dotenv');
const Bus      = require('./models/Bus');

dotenv.config();

const buses = [
  { busId:'BUS-001', route:'42A', driver:'Rajesh Kumar',  capacity:50, status:'On Route',  passengers:34, eta:'4 min'  },
  { busId:'BUS-002', route:'17B', driver:'Amit Singh',    capacity:45, status:'On Route',  passengers:18, eta:'11 min' },
  { busId:'BUS-003', route:'08C', driver:'Manoj Patel',   capacity:50, status:'Delayed',   passengers:41, eta:'19 min' },
  { busId:'BUS-004', route:'25D', driver:'Suresh Rao',    capacity:45, status:'At Stop',   passengers:7,  eta:'—'      },
  { busId:'BUS-005', route:'33E', driver:'Pradeep Nair',  capacity:50, status:'On Route',  passengers:29, eta:'7 min'  },
  { busId:'BUS-006', route:'42A', driver:'Vikram Sharma', capacity:50, status:'At Stop',   passengers:45, eta:'2 min'  },
  { busId:'BUS-007', route:'17B', driver:'Deepak Verma',  capacity:45, status:'On Route',  passengers:22, eta:'15 min' },
  { busId:'BUS-008', route:'08C', driver:'Ravi Gupta',    capacity:50, status:'On Route',  passengers:38, eta:'8 min'  },
  { busId:'BUS-009', route:'55F', driver:'Ankit Mishra',  capacity:50, status:'On Route',  passengers:31, eta:'6 min'  },
  { busId:'BUS-010', route:'62B', driver:'Sanjay Tiwari', capacity:50, status:'Delayed',   passengers:44, eta:'22 min' },
  { busId:'BUS-011', route:'55F', driver:'Rahul Dubey',   capacity:45, status:'On Route',  passengers:15, eta:'9 min'  },
  { busId:'BUS-012', route:'33E', driver:'Mohit Yadav',   capacity:50, status:'At Stop',   passengers:28, eta:'—'      },
  { busId:'BUS-013', route:'62B', driver:'Arun Pandey',   capacity:50, status:'On Route',  passengers:37, eta:'13 min' },
  { busId:'BUS-014', route:'25D', driver:'Nitin Joshi',   capacity:45, status:'On Route',  passengers:11, eta:'18 min' },
  { busId:'BUS-015', route:'42A', driver:'Kiran Mehta',   capacity:50, status:'On Route',  passengers:42, eta:'5 min'  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    for (const bus of buses) {
      await Bus.updateOne(
        { busId: bus.busId },
        { $set: bus },
        { upsert: true }
      );
    }
    console.log('Seed buses upserted (custom buses preserved)');

    mongoose.connection.close();
    console.log('Done. Connection closed.');

  } catch (error) {
    console.log('Error:', error.message);
    process.exit(1);
  }
};

seedDB();