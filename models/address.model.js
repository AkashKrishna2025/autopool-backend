const mongoose = require('mongoose');

// Define Address Schema
const addressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    address_name: { type: String, required: true },
    full_address: { type: String, required: true },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
    },
});

// Index for geospatial queries
addressSchema.index({ location: '2dsphere' });

// Create Address model
const Address = mongoose.model('Address', addressSchema);

module.exports = Address;
