const db = require("../models");
const { getPaginate } = require("../lib/helpers");
const ContactUs = db.ContactUs

exports.create = (req, res) => {
  //console.log("contact data -> ", req.body)
  if (!req.body.name && !req.body.message) {
    res.status(400).json({
      is_error: true,
      message: "Mandatory fields can not be empty!",
      error_message: "Please fill all mandatory fields",
    });
    return;
  }
  //console.log("req.body",req.body)
  const contactUs = new ContactUs({
    name: req.body.name,
    message: req.body.message,
    contact: req.body.contact,
    email: req.body.email,
    bookingId: req.body.bookingId,
  });

  contactUs.save().then((data) => {
    return res.json({ is_error: false, message: 'Message submitted successfully', data });
  }).catch(err => {
    res.status(422).json({
      is_error: true,
      message: "Please Try again later.",
      error_message: err.message
    });
  });
};


exports.findAll = (req, res) => {
  var condition = {
    status: {
      $ne: "deleted"
    }
  }
  ContactUs.find(condition).skip((pageLimit * pageNumber) - pageLimit)
  .limit(pageLimit).lean()
  .exec().then(async (result) => {
    if (result) {
      const count = await ContactUs.countDocuments().exec();
      res.json(getPaginate(result, count, pageNumber, pageLimit));
    } else {
      return res.status(404).json({ is_error: true, message: "No messages found" });
    }
  }).catch(err => {
    res.status(422).json({
      is_error: true,
      message: "Please try again later",
      error_message: err.message
    });
  });
};

exports.delete = (req, res) => {
  if (!req?.params?.id) {
    res.status(400).json({
      is_error: true,
      message: "Please Select Message",
      error_message: "Please fill all mandatory fields",
    });
    return;
  }

  ContactUs.findOneAndUpdate({ _id: req.params.id }, { status: 'deleted' }, { new: true }).then(async (data) => {
    return res.json({ is_error: false, message: 'Message deleted' });
  }).catch(err => {
    res.status(422).json({
      is_error: true,
      message: "Please Try again later.",
      error_message: err.message
    });
  });
};