const db = require("../models");
const { io, updateUserOnlineStatus } = require("../socket/socket");
const LocationLog = db.LocationLog;
const RideModel = db.Rides;

exports.create = async (req, res) => {
    try {
        if (!req.body.latitude || !req.body.longitude) {
            return res.status(400).json({
                is_error: true,
                message: "Please provide both latitude and longitude.",
                error_message: "Please provide both latitude and longitude."
            });
        }
        
        const location = new LocationLog({
            userId: req.userId,
            userType: req.userRole,
            location: {
                type: "Point",
                coordinates: [req.body.longitude, req.body.latitude]
            },
            address: req.body.address,
            accuracy: req.body.accuracy,
            heading: req.body.heading,
        });
        const currentRide = await RideModel.findOne({
            $or: [
                { userId: req.userId },
                { driverId: req.userId },
            ],
            status: { $in: ["booked", "started"] }
        });
        if(currentRide) {
            location.ride = currentRide?._id;
        }
        await updateUserOnlineStatus(req.userId, true, null, req.body.latitude, req.body.longitude, req.body.accuracy, req.body.heading)

        const savedLocation = await location.save();

        res.status(201).json(savedLocation);
        //io.emit
    } catch (error) {
        console.clear();
        console.log("---------------------------------------location log error ------------------------------");
        console.log(error);
        res.status(500).json({
            is_error: true,
            message: "Internal server error.",
            error_message: error.message
        });
    }
};
