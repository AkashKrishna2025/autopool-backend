const db = require("../models");
const {
  getPaginate,
  uploadToS3,
  uploadToGCS,
  generateRandomStrings,
  delteFromS3,
} = require("../lib/helpers");
// const { cond } = require("lodash");
const adsBanner = db.adsBanner;

exports.list = async (req, res) => {
  var condition = {};
  if (req.params.type) {
    condition.type = req.params.type;
  }
  if (req.userRole != "admin") {
    condition.$or = [{ forType: req.userRole }, { forType: "both" }];
  }
  condition.status = "active";

  console.log(condition);
  adsBanner
    .find(condition)
    .skip(pageLimit * pageNumber - pageLimit)
    .sort({ createdAt: "desc" })
    .limit(pageLimit)
    .exec()
    .then(async (data) => {
      const count = await adsBanner.countDocuments(condition).exec();
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

    let { type, forType, status } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        is_error: true,
        message: "Please select at least one document image and type",
        error_message: "Please select at least one document image and type",
      });
    }

    const newBanner = new adsBanner({
      type,
      forType,
      status,
    });

    if (Object.keys(req.files).length !== 0) {
      let file = req.files[0];
      let fileNameAr = file.originalname.split(".");
      let fileExt = fileNameAr[fileNameAr.length - 1];
      let randomString = generateRandomStrings(10);
      let fileName = `${randomString}-${Date.now().toString()}.${fileExt}`;
      let fileNameFull = `Ads_Banner/${type}/${fileName}`;

      //let s3out = await uploadToS3(file.buffer, fileNameFull, file.mimetype);
      let s3out = await uploadToGCS(file.buffer, fileNameFull, file.mimetype);
      console.log("upload out -> ", s3out);
      if (s3out) {
        newBanner.image = s3out?.Location;
        newBanner.imageName = fileName;
        newBanner.imageKey = fileNameFull;
      }
    }

    const saveBanner = await newBanner.save();
    // throw new Error(saveBanner);
    return res.json({
      is_error: false,
      message: "Data saved successfully.",
      saveBanner,
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
  adsBanner
    .findOne({ _id: req.params.id })
    .then(async (data) => {
      return res.json({ is_error: false, message: "adsBanner found", data });
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
      message: "Please Select adsBanner",
      error_message: "Please fill all mandatory fields",
    });
  }

  if (!req.body) {
    return res.status(400).send({
      message: "Data to update can't not be empty!",
    });
  }
  let updateData = {
    type: req.body.type,
    forType: req.body.forType,
    status: req.body.status,
  };

  let oldData = await adsBanner.findById(req.params.id);
  if (Object.keys(req.files).length !== 0) {
    let file = req.files[0];
    let fileNameAr = file.originalname.split(".");
    let fileExt = fileNameAr[fileNameAr.length - 1];
    let randomString = generateRandomStrings(10);
    let fileName = `${randomString}-${Date.now().toString()}.${fileExt}`;
    let fileNameFull = `Ads_Banner/${updateData.type}/${fileName}`;

    //let s3out = await uploadToS3(file.buffer, fileNameFull, file.mimetype);
    let s3out = await uploadToGCS(file.buffer, fileNameFull, file.mimetype);
    if (s3out) {
      if (oldData.image != "" && oldData.imageKey) {
        delteFromS3(oldData.imageKey);
      }

      updateData.image = s3out?.Location;
      updateData.imageName = fileName;
      updateData.imageKey = fileNameFull;
    }
  }
  console.log({ oldData, updateData });
  const id = req.params.id;
  adsBanner
    .findByIdAndUpdate(id, updateData, { new: true })
    .then(async (data) => {
      if (!data) {
        res.status(404).send({
          is_error: true,
          message: `Cannot update Banner with id=${id}. Maybe Banner was deleted!`,
        });
      } else {
        res.send({
          is_error: false,
          message: "adsBanner data updated successfully.",
          data,
        });
      }
    })
    .catch((err) => {
      res.status(422).send({
        is_error: true,
        message: "Error updating adsBanner with id=" + id,
        error_message: err.message,
      });
    });
};

exports.delete = (req, res) => {
  //console.log("req.query => ", req.params.id)
  if (!req.params.id) {
    res.status(400).json({
      is_error: true,
      message: "Please Select adsBanner",
      error_message: "Please fill all mandatory fields",
    });
    return;
  }

  adsBanner
    .findOneAndUpdate(
      { _id: req.params.id },
      { status: "deleted" },
      { new: true }
    )
    .then(async (data) => {
      return res.json({ is_error: false, message: "adsBanner deleted" });
    })
    .catch((err) => {
      res.status(422).json({
        is_error: true,
        message: "Please Try again later.",
        error_message: err.message,
      });
    });
};
