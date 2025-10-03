const db = require("../models");
const Users = db.users;
const Vehicles = db.Vehicles;
const {
  getPaginate,
} = require("../lib/helpers");

exports.all = async (req, res) => {
  console.log("All Vehicle request");
  try {

    let filter = {};
    if (req.query.driver_id) {
      console.log("here admin", req.query.driver_id)
      filter.driver_id = req.query.driver_id;
    }
    if (req.userRole == "driver") {
      filter.driver_id = req.userId;
      filter.status = {
        $ne: "deleted",
      };
      // console.log("driver login -> ", req.userId)
    }

    console.log("vehicle filter -> ", filter);
    const allVehicles = await Vehicles.find(filter)
      .skip(pageLimit * pageNumber - pageLimit)
      .sort({ createdAt: -1 })
      .limit(pageLimit)
      .lean()
      .exec();
    if (allVehicles.length <= 0) {
      return res.status(404).json({
        is_error: true,
        message: "No vehicles added yet.",
        error_message: "No vehicle data find.",
      });
    }
    const count = await Vehicles.countDocuments(filter).exec();
    const paginationData = getPaginate(allVehicles, count, pageNumber, pageLimit);
    res.json(paginationData);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      is_error: true,
      message: "Unable to add vehicle, please try again later.",
      error_message: err.message,
    });
  }
};

exports.updateStatus = (req, res) => {
  if (!req?.params?._vehicle_id) {
    res.status(400).json({
      is_error: true,
      message: "Please Select Message",
      error_message: "Please fill all mandatory fields",
    });
    return;
  }

  Vehicles.findOneAndUpdate(
    { _id: req.params._vehicle_id },
    { status: req.body.status, comment: req.body.comment },
    { new: true }
  )
    .then(async (data) => {
      var message = "Vehicle " + req.body.status;
      return res.json({ is_error: false, message });
    })
    .catch((err) => {
      res.status(422).json({
        is_error: true,
        message: "Please Try again later.",
        error_message: err.message,
      });
    });
};

exports.add = async (req, res) => {
  console.log("Add Vehicle request");
  try {
    const {
      vehicle_model,
      reg_number,
      purchase_year,
      registration_number,
      seat_offering,
      instruction,
      vehicle_type,
    } = req.body;

    if (
      !vehicle_model ||
      !reg_number ||
      !purchase_year ||
      !registration_number
    ) {
      return res.status(400).json({
        is_error: true,
        message: "Please fill all mandatory fields",
        error_message: "Please fill all mandatory fields",
      });
    }
    const existingUserVvehicle = await Vehicles.findOne({
      driver_id: req.userId,
      status: "active",
    }).exec();
    if (existingUserVvehicle) {
      return res.status(406).json({
        is_error: true,
        message: "You cannot add more than one vehicle",
      });
    }

    const existingVehicle = await Vehicles.findOne({
      reg_number: reg_number,
    }).exec();
    if (existingVehicle) {
      return res.status(409).json({
        is_error: true,
        message: "This vehicle is already in the service.",
      });
    }
    const newVehicle = new Vehicles({
      vehicle_model,
      reg_number,
      purchase_year,
      registration_number,
      seat_offering,
      instruction,
      vehicle_type,
      driver_id: req.userId,
      status: "pending",
    });

    const saveVehicle = await newVehicle.save();

    return res.json({
      is_error: false,
      message: "Thank you for registering with us.",
      saveVehicle,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      is_error: true,
      message: "Unable to add vehicle, please try again later.",
      error_message: err.message,
    });
  }
};

exports.update = async (req, res) => {
  console.log("Update Vehicle request");



  if (!req.params._vehicle_id) {
    res.status(400).json({
      is_error: true,
      message: "Please Select Faq",
      error_message: "Please fill all mandatory fields",
    });
    return;
  }

  if (!req.body) {
    return res.status(400).send({
      message: "Data to update can't not be empty!",
    });
  }



  const _vehicle_id = req.params._vehicle_id;

  Vehicles.findByIdAndUpdate(_vehicle_id, req.body, { new: true })
    .then(async (data) => {
      if (!data) {
        return res.status(404).send({
          is_error: true,
          message: `Cannot update vehicle with id=${_vehicle_id}. Maybe vehicle was deleted!`,
        });
      } else {
        return res.send({
          is_error: false,
          message: "vehicle data updated successfully.",
          data,
        });
      }
    })
    .catch((err) => {
      res.status(422).send({
        is_error: true,
        message: "Error updating vehicle with id=" + id,
        error_message: err.message,
      });
    });
};

exports.view = async (req, res) => {
  console.log("View Vehicle request");

  try {
    const vehicleData = await Vehicles.findOne({
      _id: req.params._vehicle_id,
    }).exec();
    if (!vehicleData) {
      return res.status(409).json({
        is_error: true,
        message: "Vehicle not found.",
      });
    }

    return res.json({
      is_error: false,
      message: "Data find",
      vehicleData,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      is_error: true,
      message: "Unable to load vehicle, please try again later.",
      error_message: err.message,
    });
  }
};

exports.delete = async (req, res) => {
  console.log("Delete Vehicle request");

  try {
    const where = {
      _id: req.params._vehicle_id,
    };
    const update = { status: "deleted" };

    const deleteVehicle = await Vehicles.findOneAndUpdate(where, update);
    if (!deleteVehicle) {
      return res.status(409).json({
        is_error: true,
        message: "This vehicle is already deleted.",
      });
    }

    return res.json({
      is_error: false,
      message: "Vehicle deleted sucessfully.",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      is_error: true,
      message: "Unable to delete vehicle, please try again later.",
      error_message: err.message,
    });
  }
};
