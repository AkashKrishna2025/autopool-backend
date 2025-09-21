const db = require("../models");
const {
  getPaginate,
  uploadToS3,
  generateRandomStrings,
  uploadToGCS,
} = require("../lib/helpers");
const UserDocuments = db.UserDocuments;

exports.create = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0 || !req.body.document_type) {
      return res.status(400).json({
        is_error: true,
        message: "Please select at least one document image and type",
        error_message: "Please select at least one document image and type",
      });
    }
    const datetime = new Date();
    const curDate = datetime.toISOString().slice(0, 10);
    const randomName = generateRandomStrings(10) + "-" + Date.now().toString();
    const newDoc = new UserDocuments({
      user_id: req.userId,
      document_type: req.body.document_type,
      document_number: req.body.document_number,
    });
    await Promise.all(
      req.files.map(async (file) => {
        let fileNameAr = file.originalname.split(".");
        let fileExt = fileNameAr[fileNameAr.length - 1];
        let fileName = "";
        let fileFolder = "";
        let fileNameFull = "";
        let s3out = "";

        if (file.fieldname === "front_img") {
          fileName = randomName + "-front." + fileExt;
          fileFolder = process.env.AWS_FOLDERNAME + "UserDoc";
          fileNameFull = fileFolder + "/" + curDate + "/" + fileName;
        } else if (file.fieldname === "back_img") {
          fileName = randomName + "-back." + fileExt;
          fileFolder = process.env.AWS_FOLDERNAME + "UserDoc";
          fileNameFull = fileFolder + "/" + curDate + "/" + fileName;
        }

        //s3out = await uploadToS3(file.buffer, fileNameFull, file.mimetype);
        s3out = await uploadToGCS(file.buffer, fileNameFull, file.mimetype);

        if (file.fieldname === "front_img") {
          newDoc.front_img = s3out?.Location;
          newDoc.front_img_key = fileNameFull;
          newDoc.front_img_name = fileName;
        } else if (file.fieldname === "back_img") {
          newDoc.back_img = s3out?.Location;
          newDoc.back_img_key = fileNameFull;
          newDoc.back_img_name = fileName;
        }
      })
    );

    const docData = await newDoc.save();
    return res.json({
      is_error: false,
      message: "Document Uploaded",
      data: docData,
    });
  } catch (err) {
    return res.status(500).json({
      is_error: true,
      message: "Internal Server Error",
      error_message: err.message,
    });
  }
};

exports.findAll = (req, res) => {
  var condition = {
    status: {
      $ne: "deleted",
    },
  };

  if (req.query.user_id) {
    condition.user_id = req.query.user_id;
  }
  if (req.userRole != "admin") {
    condition.user_id = req.userId;
  }
  
  console.log("Find user documents ---->", condition);
  UserDocuments.find(condition)
    .skip(pageLimit * pageNumber - pageLimit)
    .limit(pageLimit)
    .lean()
    .exec()
    .then(async (documents) => {
      if (documents.length > 0) {
        const count = await UserDocuments.countDocuments(condition).exec();
        res.json(getPaginate(documents, count, pageNumber, pageLimit));
      } else {
        res.json(getPaginate([], 0, pageNumber, pageLimit));
      }
    })
    .catch((err) => {
      console.error("Error in findAll:", err);
      res.status(422).json({
        is_error: true,
        message: "Please try again later",
        error_message: err.message,
      });
    });
};

exports.updateStatus = (req, res) => {
  if (!req?.params?.id) {
    res.status(400).json({
      is_error: true,
      message: "Please Select Message",
      error_message: "Please fill all mandatory fields",
    });
    return;
  }

  UserDocuments.findOneAndUpdate(
    { _id: req.params.id },
    { status: req.body.status, comment: req.body.comment },
    { new: true }
  )
    .then(async (data) => {
      var message = "Document " + req.body.status;
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

exports.delete = (req, res) => {
  if (!req?.params?.id) {
    res.status(400).json({
      is_error: true,
      message: "Please select document",
      error_message: "Please fill all mandatory fields",
    });
    return;
  }

  UserDocuments.findOneAndUpdate(
    { _id: req.params.id },
    { status: "deleted" },
    { new: true }
  )
    .then(async (data) => {
      return res.json({ is_error: false, message: "Document deleted" });
    })
    .catch((err) => {
      res.status(422).json({
        is_error: true,
        message: "Please Try again later.",
        error_message: err.message,
      });
    });
};
