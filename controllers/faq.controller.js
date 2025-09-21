const db = require("../models");
const { getPaginate } = require("../lib/helpers");
// const { cond } = require("lodash");
const Faq = db.Faq;

exports.list = async (req, res) => {
  var condition = {};
  if (req.userRole != "admin") {
    condition.$or = [{ faqType: req.userRole }, { faqType: "both" }];
    condition.status = "active";
  }

  console.log(condition);
  Faq.find(condition)
    .skip(pageLimit * pageNumber - pageLimit)
    .sort({ createdAt: "desc" })
    .limit(pageLimit)
    .exec()
    .then(async (data) => {
      const count = await Faq.countDocuments(condition).exec();
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
    let { question, answer, faqType } = req.body;
    if (!question && !answer && !faqType) {
      return res.status(400).json({
        is_error: true,
        message: "Please fill all mandatory fields",
        error_message: "Please fill all mandatory fields",
      });
    }

    const newFaq = new Faq({
      question,
      answer,
      faqType,
      status: "active",
    });
    const saveFaq = await newFaq.save();

    return res.json({
      is_error: false,
      message: "Faq Added.",
      saveFaq,
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
      message: "Please Select city",
      error_message: "Please fill all mandatory fields",
    });
    return;
  }

  Faq.findOne({ _id: req.params.id })
    .then(async (data) => {
      return res.json({ is_error: false, message: "Faq found", data });
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
  const id = req.params.id;
  Faq.findByIdAndUpdate(id, req.body, { new: true })
    .then(async (data) => {
      if (!data) {
        res.status(404).send({
          is_error: true,
          message: `Cannot update faq with id=${id}. Maybe faq was deleted!`,
        });
      } else
        res.send({
          is_error: false,
          message: "Faq data updated successfully.",
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
      message: "Please Select Faq",
      error_message: "Please fill all mandatory fields",
    });
    return;
  }

  Faq.findOneAndUpdate(
    { _id: req.params.id },
    { status: "deleted" },
    { new: true }
  )
    .then(async (data) => {
      return res.json({ is_error: false, message: "Faq deleted" });
    })
    .catch((err) => {
      res.status(422).json({
        is_error: true,
        message: "Please Try again later.",
        error_message: err.message,
      });
    });
};
