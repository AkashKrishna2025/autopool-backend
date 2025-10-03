const { Server } = require("socket.io");
const http = require('http');
const express = require('express');
const jwt = require("jsonwebtoken");
const db = require("../models");
const RideModel = db.Rides;
const UsersModel = db.users;
const VehicleModel = db.Vehicles;
process.env.TZ = 'Asia/Kolkata';
const app = express();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const getOnlineDrivers = async () => {
    try {
        var condition = {
            isOnline: true,
            role: "driver",
        };
        const driverLists = await UsersModel.find(condition)
            .select('_id socketId lastLocation lastLocAccuracy lastLocHeading')
            .lean()
            .exec();

        io.emit("getOnlineDrivers", driverLists);
    } catch (error) {
        console.error('Error updating user online status:', error);
    }
};

const updateUserOnlineStatus = async (userId, isOnline, socketId, latitude, longitude, lastLocAccuracy, lastLocHeading) => {
    try {
        console.log("_id -> ", userId, new Date(), socketId);
        const user = await UsersModel.findById(userId);
        if (!user) {
            console.error('User not found');
            return;
        }
        user.isOnline = isOnline;
        user.lastOnline = isOnline ? new Date() : null;
        if(latitude && longitude) {
            user.lastLocation = {
                type: "Point",
                coordinates: [longitude, latitude]
            };
        }
        if(socketId) {
            user.socketId = socketId;
        }
        if(lastLocAccuracy) {
            user.lastLocAccuracy = lastLocAccuracy;
        }
        if(lastLocHeading) {
            user.lastLocHeading = lastLocHeading;
        }
        await user.save();
        
        const currentRide = await RideModel.findOne({
            $or: [
                { userId: userId },
                { driverId: userId },
            ],
            status: { $in: ["booked", "started"] }
        }).populate([{
            path: 'userId',
            model: 'users',
        }, {
            path: 'driverId',
            model: 'users',
        }]);
        if(currentRide) {
            //console.clear();
            //console.log("driver data", currentRide.driverId);
            const vehicleInfo = await VehicleModel.find({
                driver_id: currentRide.driverId._id
            })
            const rideInfo = {
                rideId: currentRide._id,
                distance: currentRide.distanceText,
                pickLocation: currentRide.pickLocation,
                pickAddress: currentRide.pickAddress,
                dropLocation: currentRide.dropLocation,
                dropAddress: currentRide.dropAddress,
                otp: currentRide.otp,
                status: currentRide.status
            };

            rideInfo.captainInfo = {
                name: currentRide.driverId.name,
                contact_no: currentRide.driverId.contact_no,
                location: currentRide.driverId.lastLocation
            };
            rideInfo.vehicleInfo = vehicleInfo;

            io.to(currentRide.userId.socketId).emit("ride_excepted", rideInfo);
            io.to(currentRide.driverId.socketId).emit("ride_detail", rideInfo);
        } else if(user.role === "driver") {
            await getOnlineDrivers();
        }
        
        console.log('User online status updated successfully');
    } catch (error) {
        console.error('Error updating user online status:', error);
    }
};

const getReceiverSocketId = (receiverId) => {
    const userData = userSocketMap[receiverId];
    if (userData && userData.socketId) {
        return userData.socketId;
    } else {
        return null;
    }
}

const userSocketMap = {};   // {userId: {socketId, role}}

io.on("connection", (socket) => {
    console.log("User Connected", socket.id);

    const token = socket.handshake.headers.authorization.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error('Invalid token:', err.message);
            socket.disconnect(true);
        } else {
            const user = decoded;
            console.log(`User ${user.name} connected.`);
            const userId = user.id;
            userSocketMap[userId] = { socketId: socket.id, role: user.role };
            updateUserOnlineStatus(userId, true, socket.id);
            /* if (user.role === "driver") {
                updateUserOnlineStatus(userId, true, socket.id);
            } */
        }
    });

    socket.on("disconnect", () => {
        const userId = Object.keys(userSocketMap).find(key => userSocketMap[key].socketId === socket.id);
        if (userId) {
            delete userSocketMap[userId];
            updateUserOnlineStatus(userId, false, "");
            console.log("User disconnected");
        }
    });
});


module.exports = { app, io, server, getReceiverSocketId, getOnlineDrivers, updateUserOnlineStatus };
