const db = require("../models");
const { getPaginate } = require("../lib/helpers");
const ContactUs = db.ContactUs;
const webPages = db.webPages;
const Users = db.users;
const City = db.City;
const Rides = db.Rides
const moment = require("moment");
const { TimestreamQuery } = require("aws-sdk");

exports.GetKpi = async (req, res) => {
  try {
    const driverCount = await Users.countDocuments({
      status: {
        $ne: "deleted"
      },
      role: "driver"
    }).exec();
    const userCount = await Users.countDocuments({
      status: {
        $ne: "deleted"
      },
      role: "user"
    }).exec();
    const onlineDriverCount = await Users.countDocuments({
      role: "driver",
      status: "active",
    }).exec();
    const offlineDriverCount = await Users.countDocuments({
      role: "driver",
      status: "deactivate",
    }).exec();
    const onlineUserCount = await Users.countDocuments({
      status: "active",
      role: "user",
    }).exec();
    const offlineUserCount = await Users.countDocuments({
      status: "deactivate",
      role: "user",
      // isOnline: false // Filter for offline users
    }).exec();
    const cityCount = await City.countDocuments({ status: "active" }).exec();
    const supportCount = await ContactUs.countDocuments().exec();
    return res.json({
      is_error: false,
      message: 'Kpis found',
      data: {
        driverCount,
        userCount,
        cityCount,
        supportCount,
        onlineDriverCount,
        offlineDriverCount,
        offlineUserCount,
        onlineUserCount
      }
    });
  } catch (err) {
    res.status(422).json({
      is_error: true,
      message: "Please Try again later.",
      error_message: err.message
    });
  }
};

exports.home = async (req, res) => {
  console.log("Dashboard home request");
  try {
    const countUsers = async (query) => Users.countDocuments(query).exec();

    const [
      user_count,
      newUsers,
      onlineUsers,
      offlineUsers,

      newDrivers,
      driver_count,
      onlineDrivers,
      offlineDrivers,

      totalBooking,
      todaysBooking,
      weeklyBooking,
      monthlyBooking
    ] = await Promise.all([
      countUsers({ role: "user", status: 'active' }),
      countUsers({ role: "user", status: 'pending' }),
      countUsers({ role: "user", isOnline: true }),
      countUsers({ role: "user", isOnline: false }),

      countUsers({ role: "driver", status: 'pending' }),
      countUsers({ role: "driver", status: 'active' }),
      countUsers({ role: "driver", isOnline: true }),
      countUsers({ role: "driver", isOnline: false }),

      Rides.countDocuments({ status: "Completed" }),
      Rides.countDocuments({ status: "Completed", rideDate: parseInt(moment().format('DDMMYYYY')) }),
      Rides.countDocuments({ status: "Completed", rideWeek: parseInt(moment().week()), rideYear: parseInt(moment().format('YYYY')) }),
      Rides.countDocuments({ status: "Completed", rideMonth: parseInt(moment().format('MM')), rideYear: parseInt(moment().format('YYYY')) })
    ]);

    return res.json({
      is_error: false,
      message: "data found",
      data: {
        user_count,
        newUsers,
        onlineUsers,
        offlineUsers,

        driver_count,
        newDrivers,
        onlineDrivers,
        offlineDrivers,

        totalBooking,
        todaysBooking,
        weeklyBooking,
        monthlyBooking,
      },
    });
  } catch (err) {
    console.error("Error in dashboard home request:", err);
    return res.status(500).json({
      is_error: true,
      message: "Internal Server Error",
      error_message: err.message,
    });
  }
};



exports.getPage = async (req, res) => {

  if (!req.params.type) {
    res.status(400).json({
      is_error: true,
      message: "Invalid request",
      error_message: "page type not specified.",
    });
    return;
  }
  let type = req.params.type;
  console.log("web page request " + type);
  webPages.findOne({ type }).sort({ createdAt: -1 }).then(async (data) => {
    return res.json({ is_error: false, message: 'data found', data });
  }).catch(err => {
    res.status(422).json({
      is_error: true,
      message: "Please Try again later.",
      error_message: err.message
    });
  });

}
exports.updatePage = async (req, res) => {
  if (!req.params.id || !req.params.type) {
    res.status(400).json({
      is_error: true,
      message: "Invalid request",
      error_message: "Invalid request or page not found",
    });
    return;
  }

  if (!req.body) {
    return res.status(400).send({
      message: "Data to update can't not be empty!",
    });
  }

  const id = req.params.id;
  const type = req.params.type;
  console.log("update web pages request ", type);

  webPages.findByIdAndUpdate(id, req.body, { new: true }).then(async (data) => {
    if (!data) {
      res.status(404).send({
        is_error: true,
        message: `Cannot updated now Please try after some time!`
      });
    } else res.send({ is_error: false, message: 'Page data updated successfully.', data });
  }).catch(err => {
    res.status(422).send({
      is_error: true,
      message: "Error updating page with id=" + id,
      error_message: err.message
    });
  });

}
