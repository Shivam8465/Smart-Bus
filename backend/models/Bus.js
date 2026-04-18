const mongoose = require('mongoose');
const busSchema = new mongoose.Schema(
  {
    busId: {
      type:     String,
      required: true,
      unique:   true,
      trim:     true
    },
    route: {
      type:     String,
      required: true,
      trim:     true
    },
    driver: {
      type:     String,
      required: true,
      trim:     true
    },
    status: {
      type:    String,
      enum:    ['On Route', 'At Stop', 'Delayed', 'Off Duty'],
      default: 'Off Duty'
    },
    passengers: {
      type:    Number,
      default: 0,
      min:     0
    },
    capacity: {
      type:    Number,
      required: true,
      default: 50
    },
    eta: {
      type:    String,
      default: '—'
    },
    currentStop: {
      type:    String,
      default: ''
    },
    latitude: {
      type:    Number,
      default: 28.6139
    },
    longitude: {
      type:    Number,
      default: 77.2090
    },
    incidents: [
      {
        type: {
          type:    String,
          default: 'General'
        },
        description: {
          type:    String,
          default: ''
        },
        reportedBy: {
          type:    String,
          default: ''
        },
        createdAt: {
          type:    Date,
          default: Date.now
        }
      }
    ],
    lastBreakAt: {
      type: Date,
      default: null
    },
    lastLocationAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

const Bus = mongoose.model('Bus', busSchema);

module.exports = Bus;