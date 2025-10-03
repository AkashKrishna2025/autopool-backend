const db = require("../models");
const { getPaginate } = require("../lib/helpers");
// const { cond } = require("lodash");
const Wallet = require('../models/wallet.model');
const User = db.users


exports.create = async (req, res) => {
  try {
    console.log(req.body);
    if (!req.userId) {
      return res.status(400).json({
        is_error: true,
        message: "User not found",
        error_message: "User not found"
      });
    }
    let { amount } = req.body;
    if (!amount) {
      return res.status(400).json({
        is_error: true,
        message: "Please fill amount fields",
        error_message: "Please fill amount fields",
      });
    }

    const wallet = await Wallet.findOneAndUpdate(
      { userId: req.userId },
      { $inc: { amount: amount } },
      { new: true, upsert: true }
    );

    return res.json({
      is_error: false,
      message: "Amount added to wallet.",
      wallet,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      is_error: true,
      message: "Unable to add amount, please try again later.",
      error_message: err.message,
    });
  }
};

exports.detail = async (req, res) => {
  try {
    const userId = req.userId;

    // Find the user in the database to ensure the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        is_error: true,
        message: "User not found",
        error_message: "User not found",
      });
    }

    // Query the first address associated with the user's ID
    const wallet = await Wallet.findOne({ userId: userId });

    if (!wallet) {
      return res.status(404).json({
        is_error: true,
        message: "Address not found for this user",
        error_message: "Address not found for this user",
      });
    }

    return res.json({
      is_error: false,
      wallet,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      is_error: true,
      message: "Unable to fetch user address, please try again later.",
      error_message: err.message,
    });
  }
};

