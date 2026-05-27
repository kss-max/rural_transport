const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  vehicleOwnerName: {
    type: String,
    required: true
  },
  vehicleCategory: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pickup: {
    type: String,
    required: true
  },
  drop: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['', 'PENDING', 'PENDING_SYNC', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING'
  },

  // --- Enhanced booking type fields ---
  bookingType: {
    type: String,
    enum: ['instant', 'scheduled', 'rental'],
    default: 'instant',
    required: true
  },
  // Scheduled booking fields
  scheduledDate: {
    type: Date
  },
  // Rental booking fields
  rentalHours: {
    type: Number
  },
  rentalStartDate: {
    type: Date
  },
  rentalEndDate: {
    type: Date
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

// Custom validation
bookingSchema.pre('validate', function() {
  if (this.bookingType === 'scheduled' && !this.scheduledDate) {
    throw new Error('scheduledDate is required for scheduled bookings');
  }
  if (this.bookingType === 'scheduled' && this.scheduledDate) {
    if (new Date(this.scheduledDate) <= new Date()) {
      throw new Error('scheduledDate must be in the future');
    }
  }
  if (this.bookingType === 'rental') {
    if (!this.rentalHours && !this.rentalStartDate) {
      throw new Error('rentalHours or rentalStartDate is required for rental bookings');
    }
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
