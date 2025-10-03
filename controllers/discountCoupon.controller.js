const db = require("../models");
const {
  getPaginate,
  uploadToS3,
  generateRandomStrings,
  delteFromS3,
} = require("../lib/helpers");
const { connect } = require("mongoose");
// const { cond } = require("lodash");
const discountCoupon = db.discountCoupon;

exports.list = async (req, res) => {
  var condition = {};
  if (req.params.type) {
    condition.type = req.params.type;
  }
  if (req.userRole != "admin") {
    // condition.$or = [{ forType: req.userRole }, { forType: "both" }];
    condition.status = "active";
  }

  console.log(condition);
  discountCoupon
    .find(condition)
    .skip(pageLimit * pageNumber - pageLimit)
    .sort({ createdAt: "desc" })
    .limit(pageLimit)
    .exec()
    .then(async (data) => {
      const count = await discountCoupon.countDocuments(condition).exec();
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

const getIntergarDate = function (inputDate) {
  const moment = require("moment");
  const parsedDate = moment(inputDate, "DD/MM/YYYY");
  const formattedDate = parseInt(parsedDate.format("YYYYMMDD"));
  console.log(formattedDate);
  return formattedDate;
};

exports.create = async (req, res) => {
  try {
    if (!req.body.validFrom && !req.body.validTo && !req.body) {
      throw new Error("Please fill all details first");
    }

    let {
      code,
      discountUpto,
      validity,
      type,
      validFrom,
      validTo,
      totalUsage,
      currentUsage,
      status,
    } = req.body;

    let validFrom_int = getIntergarDate(validFrom);
    let validTo_int = getIntergarDate(validTo);

    const newCoupon = new discountCoupon({
      code,
      discountUpto,
      validity,
      type,

      validFrom,
      validFrom_int,

      validTo,
      validTo_int,

      totalUsage,
      currentUsage,

      status,
      addedBy: req.userId,
    });

    // if (Object.keys(req.files).length !== 0) {
    //   let file = req.files[0];
    //   let fileNameAr = file.originalname.split(".");
    //   let fileExt = fileNameAr[fileNameAr.length - 1];
    //   let randomString = generateRandomStrings(10);
    //   let fileName = `${randomString}-${Date.now().toString()}.${fileExt}`;
    //   let fileNameFull = `Ads_Banner/${type}/${fileName}`;

    //   let s3out = await uploadToS3(file.buffer, fileNameFull, file.mimetype);
    //   if (s3out) {
    //     newBanner.image = s3out?.Location;
    //     newBanner.imageName = fileName;
    //     newBanner.imageKey = fileNameFull;
    //   }
    // }

    const saveCoupon = await newCoupon.save();
    // throw new Error(saveBanner);
    return res.json({
      is_error: false,
      message: "Data saved successfully.",
      saveCoupon,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      is_error: true,
      message: "Unable to add Banner, please try again later.",
      error_message: err.message,
    });
  }
};

exports.detail = async (req, res) => {
  discountCoupon
    .findOne({ _id: req.params.id })
    .then(async (data) => {
      return res.json({
        is_error: false,
        message: "discount Coupon found",
        data,
      });
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
    return res.status(400).json({
      is_error: true,
      message: "Please Select Coupon first",
      error_message: "Please fill all mandatory fields",
    });
  }
  if (!req.body) {
    return res.status(400).send({
      message: "Data to update can't not be empty!",
    });
  }

  let updateData = req.body;
  updateData.validFrom_int = getIntergarDate(updateData.validFrom);
  updateData.validTo_int = getIntergarDate(updateData.validTo);

  let oldData = await discountCoupon.findById(req.params.id);
  // if (Object.keys(req.files).length !== 0) {
  //   let file = req.files[0];
  //   let fileNameAr = file.originalname.split(".");
  //   let fileExt = fileNameAr[fileNameAr.length - 1];
  //   let randomString = generateRandomStrings(10);
  //   let fileName = `${randomString}-${Date.now().toString()}.${fileExt}`;
  //   let fileNameFull = `Ads_Banner/${updateData.type}/${fileName}`;

  //   let s3out = await uploadToS3(file.buffer, fileNameFull, file.mimetype);
  //   if (s3out) {
  //     if (oldData.image != "" && oldData.imageKey) {
  //       delteFromS3(oldData.imageKey);
  //     }

  //     updateData.image = s3out?.Location;
  //     updateData.imageName = fileName;
  //     updateData.imageKey = fileNameFull;
  //   }
  // }
  console.log({ oldData, updateData });
  const id = req.params.id;
  discountCoupon
    .findByIdAndUpdate(id, updateData, { new: true })
    .then(async (data) => {
      if (!data) {
        res.status(404).send({
          is_error: true,
          message: `Cannot update discount coupon with id=${id}. Maybe discount coupon was deleted!`,
        });
      } else {
        res.send({
          is_error: false,
          message: "discount coupon data updated successfully.",
          data,
        });
      }
    })
    .catch((err) => {
      res.status(422).send({
        is_error: true,
        message: "Error updating discountCoupon with id=" + id,
        error_message: err.message,
      });
    });
};

exports.delete = (req, res) => {
  //console.log("req.query => ", req.params.id)
  if (!req.params.id) {
    res.status(400).json({
      is_error: true,
      message: "Please Select discount coupon",
      error_message: "Please fill all mandatory fields",
    });
    return;
  }

  discountCoupon
    .findOneAndUpdate(
      { _id: req.params.id },
      { status: "deleted" },
      { new: true }
    )
    .then(async (data) => {
      return res.json({ is_error: false, message: "discount coupon deleted" });
    })
    .catch((err) => {
      res.status(422).json({
        is_error: true,
        message: "Please Try again later.",
        error_message: err.message,
      });
    });
};
