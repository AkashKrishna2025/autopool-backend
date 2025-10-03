module.exports = (mongoose) => {
    const UserLocationHistory = mongoose.model(
        "userLocationHistory",
        mongoose.Schema(
            {
                userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
                pickLocation: {
                    type: { type: String, enum: ['Point'], default: 'Point' },
                    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
                },
                pickAddress: { type: String, required: false, default: '' },
                pickGeocode: { type: Object, required: false, default: {} },

                dropLocation: {
                    type: { type: String, enum: ['Point'], default: 'Point' },
                    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
                },
                dropAddress: { type: String, required: false, default: '' },
                dropGeocode: { type: Object, required: false, default: {} },


                addressType: { type: String, required: false, default: '' },
                distance: { type: Number, required: false, default: 0 },
                distanceValue: { type: Number, required: false, default: 0 },
                distanceUnit: { type: String, required: false, default: '' },
                distanceText: { type: String, required: false, default: '' },
                historyType: { type: String, required: true, default: 'search' },  // search / saved places
                status: { type: String, default: "active" },

                private_fare: { type: Object, required: false, default: {} },
                share_fare: { type: Object, required: false, default: {} },
            },
            { timestamps: true }
        )
    );

    return UserLocationHistory;
};
