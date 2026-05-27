const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  ownerName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  village: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  pricePerKm: {
    type: Number,
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

module.exports = mongoose.model('Vehicle', vehicleSchema);
