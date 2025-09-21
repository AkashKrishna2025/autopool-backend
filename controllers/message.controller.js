
const db = require("../models");
const RideModel = db.Rides;
const MessageModel = db.Message;
const { io } = require('../socket/socket');

exports.sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const senderId = req.userId;

    let ride = await RideModel.findOne({
      _id: req.params.rideId,
    }).populate([{
      path: 'userId',
      model: 'users',
    }, {
      path: 'driverId',
      model: 'users',
    }]);

    if (!ride) {
      return res.status(404).json({
        is_error: true,
        message: "Please check ride again",
        error_message: "unable to find this ride"
      });
    }

    let recieverId = "";
    let recieverSocketId = "";
    if(req.userRole === "driver") {
      recieverId = ride.userId._id;
      recieverSocketId = ride.userId.socketId;
    } else {
      recieverId = ride.driverId._id;
      recieverSocketId = ride.driverId.socketId;
    }

    const newMessage = new MessageModel({
      senderId,
      recieverId,
      message
    });

    if (newMessage) {
      ride.messages.push(newMessage._id);
    }
    await Promise.all([await ride.save(), await newMessage.save()]);

    
    if (recieverSocketId) {
      io.to(recieverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json({
      is_error: false,
      message: "Message Sent",
      newMessage
    })

  } catch (error) {
    res.status(500).json({
      is_error: true,
      message: "Internal server error, please try again later",
      errorMsg: error?.message,
      databody: req.body
    })
  }
};

exports.getMessages = async (req, res) => {
  try {
    const rideId = req.params.rideId;

    let ride = await RideModel.findOne({
      _id: rideId,
    }).populate("messages");

    if (!ride) {
      res.status(200).json({
        message: "Message not found",
        allMessages: []
      })
    } else if(!ride.messages) {
      res.status(200).json({
        message: "Message not found",
        allMessages: [],
      })
    } else {
      res.status(200).json({
        message: "Messages found",
        allMessages: ride.messages
      })
    }

  } catch (error) {
    res.status(500).json({
      message: "Internal server error, please try again later",
      errorMsg: error?.message
    });
  }
};