module.exports = (mongoose) => {
    const FareManagement = mongoose.model(
        "fare_management",
        mongoose.Schema(
            {
                state_id: { type: mongoose.Schema.Types.ObjectId, ref: "states" },
                city_id: { type: mongoose.Schema.Types.ObjectId, ref: "cities" },
                name: { type: String, required: false },
                baseKm: { type: Number, required: false, default: 0 },
                baseKmFare: { type: Number, required: false, default: 0 },
                perKmFare: { type: Number, required: false, default: 0 },
                vehicleType: { type: String, required: false, default: ""}, // private / share
                status: { type: String, default: "active" },
            },
            { timestamps: true }
        )
    );

    return FareManagement;
};
