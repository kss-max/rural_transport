const mongoose = require('mongoose');

const busTripSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },
  routeId: {
    type: String,
    required: true
  },
  routeName: {
    type: String,
    required: true
  },
  fromPlace: {
    type: String,
    required: true
  },
  toPlace: {
    type: String,
    required: true
  },
  vehicleNumber: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['STARTED', 'COMPLETED', 'CANCELLED'],
    default: 'STARTED'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    default: null
  },
  currentLocation: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  lastLocationUpdate: {
    type: Date,
    default: null
  },
  speeds: [{
    type: Number
  }],
  averageSpeed: {
    type: Number,
    default: 0
  },
  currentStopIndex: {
    type: Number,
    default: 0
  },
  stops: [{
    stopId: String,
    stopName: String,
    latitude: Number,
    longitude: Number,
    arrivedAt: Date,
    isCompleted: {
      type: Boolean,
      default: false
    }
  }],
  passengers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    pickupStop: String,
    dropoffStop: String,
    bookedAt: Date,
    fare: Number
  }],
  totalPassengers: {
    type: Number,
    default: 0
  },
  totalFare: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

module.exports = mongoose.model('BusTrip', busTripSchema);
