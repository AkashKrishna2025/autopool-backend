const db = require("../models");
const { getPaginate } = require("../lib/helpers");
const Address = require('../models/address.model')
const User = db.users

// Create address API endpoint

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

    if (!req.body.latitude || !req.body.longitude) {
      return res.status(400).json({
        is_error: true,
        message: "Please provide both latitude and longitude.",
        error_message: "Please provide both latitude and longitude."
      });
    }

    if (!req.body.address_name && !req.body.full_address) {
      return res.status(400).json({
        is_error: true,
        message: "Please fill all mandatory fields (address_name, address)",
        error_message: "Please fill all mandatory fields (address_name, address)"
      });
    }

    const address = await Address.create({
      userId: req.userId,
      address_name: req.body.address_name,
      full_address: req.body.full_address,
      location: {
        type: "Point",
        coordinates: [req.body.longitude, req.body.latitude]
      },
    });

    return res.status(201).json({
      is_error: false,
      message: "Address Added.",
      address,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      is_error: true,
      message: "Unable to add Address, please try again later.",
      error_message: err.message,
    });
  }
};
exports.update = async (req, res) => {
  try {
    const addressId = req.params.id;
    const updatedFields = {
      address_name: req.body.address_name,
      full_address: req.body.full_address,
      location: {
        type: "Point",
        coordinates: [req.body.longitude, req.body.latitude]
      },
    };
    const updatedAddress = await Address.findByIdAndUpdate(
      addressId,
      updatedFields,
      { new: true } // To return the updated document
    );
    if (!updatedAddress) {
      return res.status(404).json({
        is_error: true,
        message: "Address not found",
        error_message: "Address not found",
      });
    }
    return res.json({
      is_error: false,
      message: "Address updated successfully",
      address: updatedAddress,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      is_error: true,
      message: "Unable to update address, please try again later.",
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
    const address = await Address.findOne({ userId: userId });

    if (!address) {
      return res.status(404).json({
        is_error: true,
        message: "Address not found for this user",
        error_message: "Address not found for this user",
      });
    }

    return res.json({
      is_error: false,
      address,
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
exports.list = async (req, res) => {
  var condition = {};
  if (req.userRole != 'admin') {
    condition.userId = req.userId;
  }
  console.log("address list request ", condition);
  Address.find(condition).skip((pageLimit * pageNumber) - pageLimit)
    .sort({ createdAt: 'desc' })
    .limit(pageLimit)
    .exec().then(
      async (data) => {
        const count = await Address.countDocuments(condition).exec();
        res.json(getPaginate(data, count, pageNumber, pageLimit));
      }).catch(err => {
        res.status(422).json({
          is_error: true,
          message: "Please Try again later.",
          error_message: err.message
        });
      });
};
exports.delete = async (req, res) => {
  try {
    const addressId = req.params.id;
    // Check if addressId is valid if needed
    const deletedAddress = await Address.findByIdAndDelete(addressId);
    if (!deletedAddress) {
      return res.status(404).json({
        is_error: true,
        message: "Address not found",
        error_message: "Address not found",
      });
    }
    return res.json({
      is_error: false,
      message: "Address deleted successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      is_error: true,
      message: "Unable to delete address, please try again later.",
      error_message: err.message,
    });
  }
};

