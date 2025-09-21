const db = require("../models");
const { getPaginate } = require("../lib/helpers");
// const { cond } = require("lodash");
const FareModel = db.Fare;

exports.list = async (req, res) => {
  var condition = {};
  if (req.query.state_id) {
    condition.state_id = req.query.state_id;
  }
  if (req.query.city_id) {
    condition.city_id = req.query.city_id;
  }
  if (req.query.vehicleType) {
    condition.vehicleType = req.query.vehicleType;
  }
  condition.status = "active";

  //console.log(condition);
  FareModel.find(condition)
    .populate(["state_id", "city_id"])
    .skip(pageLimit * pageNumber - pageLimit)
    .sort({ createdAt: "desc" })
    .limit(pageLimit)
    .exec()
    .then(async (data) => {
      const count = await FareModel.countDocuments(condition).exec();
      res.json(getPaginate(data, count, pageNumber, pageLimit));
    })
    .catch((err) => {
      res.status(422).json({
        is_error: true,
        message: "Please Try again later.",
        error_message: err.message,
      });
    });
};

exports.create = async (req, res) => {
  try {
    console.log(req.body);
    let { state_id, city_id, name, baseKm, baseKmFare, perKmFare, vehicleType } = req.body;
    if (!state_id || !city_id || !baseKm || !baseKmFare || !perKmFare || !vehicleType) {
      return res.status(400).json({
        is_error: true,
        message: "Please fill all mandatory fields",
        error_message: "Please fill all mandatory fields",
      });
    }

    const newFare = await FareModel.create({
      state_id,
      city_id,
      name,
      baseKm,
      baseKmFare,
      perKmFare,
      vehicleType
    });

    return res.status(201).json({
      is_error: false,
      message: "Fare Added.",
      newFare,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      is_error: true,
      message: "Unable to add faq, please try again later.",
      error_message: err.message,
    });
  }
};

exports.detail = async (req, res) => {
  if (!req.params.id) {
    res.status(400).json({
      is_error: true,
      message: "Please fare first",
      error_message: "Fare id not sent",
    });
    return;
  }

  FareModel.findOne({ _id: req.params.id }).populate(["state_id", "city_id"])
    .then(async (data) => {
      return res.json({ is_error: false, message: "Fare found", data });
    })
    .catch((err) => {
      res.status(422).json({
        is_error: true,
        message: "Please Try again later.",
        error_message: err.message,
      });
    });
};

exports.update = async (req, res) => {
  if (!req.params.id) {
    res.status(400).json({
      is_error: true,
      message: "Please Select Fare",
      error_message: "Please fill all mandatory fields",
    });
    return;
  }

  if (!req.body) {
    return res.status(400).send({
      message: "Data to update can't not be empty!",
    });
  }
  const id = req.params.id;
  FareModel.findByIdAndUpdate(id, req.body, { new: true })
    .then(async (data) => {
      if (!data) {
        res.status(404).send({
          is_error: true,
          message: `Cannot update faq with id=${id}. Maybe faq was deleted!`,
        });
      } else
        res.send({
          is_error: false,
          message: "Fare data updated successfully.",
          data,
        });
    })
    .catch((err) => {
      res.status(422).send({
        is_error: true,
        message: "Error updating Faq with id=" + id,
        error_message: err.message,
      });
    });
};

exports.delete = (req, res) => {
  //console.log("req.query => ", req.params.id)
  if (!req.params.id) {
    res.status(400).json({
      is_error: true,
      message: "Please Select Fare",
      error_message: "Please fill all mandatory fields",
    });
    return;
  }

  FareModel.findOneAndUpdate(
    { _id: req.params.id },
    { status: "deleted" },
    { new: true }
  )
    .then(async (data) => {
      return res.json({ is_error: false, message: "Fare deleted" });
    })
    .catch((err) => {
      res.status(422).json({
        is_error: true,
        message: "Please Try again later.",
        error_message: err.message,
      });
    });
};
