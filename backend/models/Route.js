const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  position:   { type: Number, required: true },
  distanceKm: { type: Number, required: true }
});

const routeSchema = new mongoose.Schema(
  {
    routeId: {
      type:     String,
      required: true,
      unique:   true,
      trim:     true
    },
    name: {
      type:     String,
      required: true,
      trim:     true
    },
    stops: [stopSchema],
    totalStops: {
      type:    Number,
      default: 0
    },
    distance: {
      type:    String,
      default: ''
    },
    frequency: {
      type:    String,
      default: ''
    },
    status: {
      type:    String,
      enum:    ['Active', 'Inactive', 'Suspended'],
      default: 'Active'
    }
  },
  { timestamps: true }
);

const Route = mongoose.model('Route', routeSchema);

module.exports = Route;