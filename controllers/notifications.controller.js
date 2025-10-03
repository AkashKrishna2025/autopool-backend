const db = require("../models");
const Notification = require("../models/notification.model")

exports.detail = async (req, res) => {
  if (!req.userId) {
    res.status(400).json({
      is_error: true,
      message: "Please provide userId",
      error_message: "Please fill all mandatory fields",
    });
    return;
  }

  try {
    const notifications = await Notification.find({ userId: req.userId });
    return res.json({ is_error: false, message: 'Notifications found', data: notifications });
  } catch (err) {
    res.status(422).json({
      is_error: true,
      message: "Please try again later.",
      error_message: err.message
    });
  }
};
