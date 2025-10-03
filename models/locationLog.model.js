module.exports = mongoose => {
    const LocationLog = mongoose.model(
        "LocationLogs",
        mongoose.Schema(
            {
                userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
                userType: { type: String, default: '' },
                location: {
                    type: { type: String, enum: ['Point'], default: 'Point' },
                    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
                },
                address: { type: String, required: false },
                accuracy: { type: Number, default: 0},
                heading: { type: Number, default: 0},
                ride: { type: mongoose.Schema.Types.ObjectId, ref: "rides" },
            },
            { timestamps: true }
        )
    );

    LocationLog.collection.createIndex({ "location.coordinates": "2dsphere" });

    return LocationLog;
};