module.exports = (mongoose) => {

    let rideSchema = mongoose.Schema({
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
        pickLocation: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
        },
        pickAddress: { type: String, required: false, default: '' },
        dropLocation: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
        },
        dropAddress: { type: String, required: false, default: '' },
        distance: { type: Number, required: false, default: 0 }, // in kilometers
        distanceValue: { type: Number, required: false, default: 0 }, // in meters
        distanceUnit: { type: String, required: false, default: '' }, // km / m
        distanceText: { type: String, required: false, default: '' },

        driverId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
        searchHistory_id: { type: mongoose.Schema.Types.ObjectId, ref: "userLocationHistory" }, // search history id 

        vehicleType: { type: String, required: true },  // Private / Share
        SharedRideId: { type: String, required: false, default: '' },//random id if vehicle type is "shared"


        otp: { type: String, required: false },
        status: { type: String, default: "pending" },  // pending / booked / started / canceld / rejected
        durationInMin: { type: Number, default: 0 },
        durationText: { type: String, default: "0 min" },
        totalFare: { type: Number, default: 0 },
        endOtp: { type: String, required: false },
        cancelAllowed: { type: String, required: true, default: true },
        cancelledBy: { type: String, default: "" },  // driver / user
        cancelledReason: { type: String, default: "" },


        messages: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "message",
                default: []
            }
        ],

        rideStart_timeDate: { type: Object, required: false, default: {} },
        rideEnd_timeDate: { type: Object, required: false, default: {} },

        rideDate: { type: Number, default: '' },
        rideWeek: { type: Number, default: '' },
        rideYear: { type: Number, default: '' },
        rideMonth: { type: Number, default: '' },


        payStatus: { type: String, default: 'completed' },
        payMode: { type: String, default: 'cash' },
    },
        { timestamps: true });


    rideSchema.index({ pickLocation: '2dsphere' });
    
    const Rides = mongoose.model("rides", rideSchema);
    return Rides;
};
