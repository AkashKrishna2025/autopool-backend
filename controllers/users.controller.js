const db = require("../models");
const moment = require("moment");
const Users = db.users;
const Vehicles = db.Vehicles;
const Rides = db.Rides
const auth = require("../lib/auth");
const {
  getPaginate,
  uploadToS3,
  generateRandomStrings,
  uploadFileToS3,
  delteFromS3,
  capitalizeLetter,
  sendNotification,
  uploadToGCS
} = require("../lib/helpers");

const bcrypt = require("bcrypt");
const { io } = require("../socket/socket.js");

const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);

exports.create = async (req, res) => {
  if (!req.body.name) {
    res.status(400).send({ message: "Content can not be empty!" });
    return;
  }

  const users = new Users({
    name: req.body.name,
    email: req.body.email,
  });

  users
    .save(users)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while creating the Users.",
      });
    });
};

exports.userList = async (req, res) => {
  try {
    var condition = {
      role: "user",
    };

    if (req.query.isOnline) {
      condition.isOnline = req.query.isOnline;
    }
    if (req.query.status) {
      condition.status = req.query.status;
    }



    const users = await Users.find(condition)
      .skip(pageLimit * pageNumber - pageLimit)
      .sort({ createdAt: "desc" })
      .limit(pageLimit)
      .lean()
      .exec();

    const count = await Users.countDocuments(condition).exec();
    const paginationData = getPaginate(users, count, pageNumber, pageLimit);
    res.json(paginationData);
  } catch (err) {
    return res.status(500).json({
      is_error: true,
      message: "Internal Server Error",
      error_message: err.message,
    });
  }
};



exports.driverList = async (req, res) => {
  try {
    const condition = {
      role: "driver",
    };
    if (req.query.isOnline) {
      condition.isOnline = req.query.isOnline;
    }
    if (req.query.status) {
      condition.status = req.query.status;
    }

    console.log({ condition });
    const drivers = await Users.find(condition)
      .skip(pageLimit * pageNumber - pageLimit)
      .sort({ createdAt: "desc" })
      .limit(pageLimit)
      .lean()
      .exec();

    const count = await Users.countDocuments(condition).exec();
    const paginationData = getPaginate(drivers, count, pageNumber, pageLimit);
    res.json(paginationData);
  } catch (err) {
    return res.status(500).json({
      is_error: true,
      message: "Internal Server Error",
      error_message: err.message,
    });
  }
};

exports.findOne = async (req, res) => {
  const id = req.params.id;

  Users.findById(id)
    .then((data) => {
      if (!data)
        res.status(404).send({ is_error: true, message: "unable to find user with id " + id });
      else res.send({ is_error: false, data });
    })
    .catch((err) => {
      res
        .status(500)
        .send({ is_error: true, message: "Error unable to find user with id =" + id });
    });
};

exports.update = async (req, res) => {
  if (!req.body) {
    return res.status(400).send({
      message: "Data to update can not be empty!",
    });
  }

  const id = req.params.id;

  Users.findByIdAndUpdate(id, req.body, { useFindAndModify: false })
    .then((data) => {
      if (!data) {
        res.status(404).send({
          is_error: true,
          message: `Cannot update user with id=${id}. Maybe user was not found!`,
        });
      } else res.send({ is_error: false, message: "user updated successfully." });
    })
    .catch((err) => {
      res.status(500).send({
        is_error: true,
        message: "Error updating user with id=" + id,
      });
    });
};

exports.delete = async (req, res) => {
  const id = req.params.id;

  Users.findById(id)
    .then((user) => {
      if (!user) {
        return res.status(404).send({
          is_error: true,
          message: `Cannot delete user with id=${id}. User not found!`,
        });
      }
      if (user.role !== 'admin') {
        return Users.findByIdAndUpdate(id, { status: "deleted" })
          .then(() => {
            res.send({ is_error: false, message: "User deleted successfully." });
          })
          .catch((err) => {
            console.error("Error deleting user:", err);
            res.status(500).send({
              is_error: true,
              message: `Could not delete user with id=${id}: ${err.message}`,
            });
          });
      } else {
        return res.status(403).send({
          is_error: true,
          message: "Cannot delete user. Admin role is required!",
        });
      }
    })
    .catch((err) => {
      console.error("Error finding user:", err);
      res.status(500).send({
        is_error: true,
        message: `Error finding user with id=${id}: ${err.message}`,
      });
    });
};

exports.profile = async (req, res) => {
  console.log("Profile request");
  try {
    if (!req.userId) {
      return res
        .status(401)
        .json({ is_error: true, message: "You Are Not Authorized" });
    }
    let user = await Users.findOne({ _id: req.userId }).lean();
    if (!user) {
      return res.status(401).json({
        is_error: true,
        message: "You Are Not Authorized, Please Re-Login",
      });
    }

    if (user.role == "driver") {
      // Calculate total jobs and total distance for the driver
            const completedRides = await Rides.find({ driverId: user._id, status: /^completed$/i });
      const totalJobs = completedRides.length;
      const totalDistance = completedRides.reduce((sum, ride) => sum + (ride.distance || 0), 0);

      // totalOnlineHours calculation is not directly available from existing models.
      // It would require a dedicated logging mechanism for driver online/offline status.
      let totalOnlineMilliseconds = 0;
      for (const ride of completedRides) {
        if (ride.rideStart_timeDate && ride.rideEnd_timeDate) {
          const startTimeString = `${ride.rideStart_timeDate.date} ${ride.rideStart_timeDate.time}`;
          const endTimeString = `${ride.rideEnd_timeDate.date} ${ride.rideEnd_timeDate.time}`;

          const startTime = moment(startTimeString, "DD MMMM YYYY hh:mm A");
          const endTime = moment(endTimeString, "DD MMMM YYYY hh:mm A");

          if (startTime.isValid() && endTime.isValid()) {
            const duration = moment.duration(endTime.diff(startTime));
            totalOnlineMilliseconds += duration.asMilliseconds();
          }
        }
      }
      const totalOnlineHours = totalOnlineMilliseconds / (1000 * 60 * 60);

      user.totalOnlineHours = totalOnlineHours;
      user.totalDistance = totalDistance;
      user.totalJobs = totalJobs;

      const date = new Date(user.createdAt);
      user.memberSince = date.getFullYear();

      let documentsVarified = true;
      const docTypes = [
        "Vehicle Insurance",
        "Adhar",
        "License",
        "Vehicle Registration",
      ];

      for (let document of docTypes) {
        const docFind = await db.UserDocuments.findOne({
          user_id: user._id,
          document_type: document,
          status: "approved",
        }).sort({ createdAt: -1 });

        if (!docFind) {
          documentsVarified = false; // if document is not varified then false is returned
          break;
        }
        // console.log({ document, documentsVarified });
      }

      user.allDocumentsVarified = documentsVarified;
    }

    return res.json({
      is_error: false,
      message: "Profile found",
      data: user,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      is_error: true,
      message: "Internal Server Error",
      error_message: err.message,
    });
  }
};

exports.profileUpdate = async (req, res) => {
  console.log("Profile update request");

  try {
    if (!req.userId) {
      return res
        .status(401)
        .json({ is_error: true, message: "Please select user" });
    }

    const user = await Users.findById(req.userId);
    if (!user) {
      return res.status(401).json({
        is_error: true,
        message: "You Are Not Authorized, Please Re-Login",
      });
    }

    if (req?.body?.email) {
      const alreadyEmailUser = await Users.findOne({
        email: req.body.email,
        _id: { $ne: user._id },
      });
      if (alreadyEmailUser) {
        return res
          .status(400)
          .json({ is_error: true, message: "Email already exists" });
      }
    }

    if (req?.body?.contact_no) {
      const alreadyEmailUser = await Users.findOne({
        contact_no: req.body.contact_no,
        _id: { $ne: user._id },
      });
      if (alreadyEmailUser) {
        return res
          .status(400)
          .json({ is_error: true, message: "Contact No. already exists" });
      }
    }

    req.body.profile_img = user.profile_img;
    req.body.profile_img_key = user.profile_img_key;
    req.body.profile_img_name = user.profile_img_name;

    if (
      req.files &&
      req.files[0] &&
      req.files[0].fieldname === "profile_image"
    ) {
      const datetime = new Date();
      const curDate = datetime.toISOString().slice(0, 10);
      const file = req.files[0];
      const fileNameAr = file.originalname.split(".");
      const fileExt = fileNameAr[fileNameAr.length - 1];
      const fileName =
        generateRandomStrings(10) + "-" + Date.now().toString() + "." + fileExt;
      const fileFolder = process.env.AWS_FOLDERNAME + "Users";
      const fileNameFull = fileFolder + "/" + curDate + "/" + fileName;

      //const s3out = await uploadToS3(file.buffer, fileNameFull, file.mimetype);
      const s3out = await uploadToGCS(file.buffer, fileNameFull, file.mimetype);

      req.body.profile_img = s3out?.Location;
      req.body.profile_img_key = fileNameFull;
      req.body.profile_img_name = fileName;
    }

    const updatedUser = await Users.findByIdAndUpdate(
      user._id,
      {
        name: req.body.name,
        gender: req.body.gender,
        city: req.body.city,
        name: req.body.name,
        email: req.body.email,
        contact_no: req.body.contact_no,
        profile_img: req.body.profile_img,
        profile_img_key: req.body.profile_img_key,
        profile_img_name: req.body.profile_img_name,
        firebase_token: req.body.firebase_token,
      },
      { new: true }
    );

    const tokenData = {
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      contact_no: updatedUser?.contact_no,
      profile_img: updatedUser?.profile_img,
      profile_img_key: updatedUser?.profile_img_key,
      profile_img_name: updatedUser?.profile_img_name,
      role: updatedUser.role,
      isAdmin: updatedUser.isAdmin,
      gender: updatedUser?.gender,
      city: updatedUser?.city,
      country: updatedUser?.country,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };

    const access_token = auth.generateToken(tokenData);
    const refresh_token = auth.generateRefreshToken(tokenData);

    return res.json({
      is_error: false,
      message: "Profile updated",
      data: updatedUser,
      access_token,
      refresh_token,
    });
  } catch (err) {
    return res.status(500).json({
      is_error: true,
      message: "Internal Server Error",
      error_message: err.message,
    });
  }
};

exports.updatePass = async (req, res) => {
  console.log("Password update request");

  try {
    if (!req.userId) {
      return res
        .status(401)
        .json({ is_error: true, message: "Please select user" });
    }

    const user = await Users.findById(req.userId);
    if (!user) {
      return res.status(401).json({
        is_error: true,
        message: "You Are Not Authorized, Please Re-Login",
      });
    }

    if (
      !req.body.password ||
      !req.body.confirm_password ||
      req.body.password !== req.body.confirm_password
    ) {
      return res.status(400).json({
        is_error: true,
        message: "Please fill all mandatory fields and ensure passwords match",
        error_message:
          "Please fill all mandatory fields and ensure passwords match",
      });
    }

    const hashedPassword = bcrypt.hashSync(req.body.password, 10);

    const updatedUser = await Users.findByIdAndUpdate(
      user._id,
      { password: hashedPassword },
      { new: true }
    );
    return res.json({
      is_error: false,
      message: "Password updated",
      data: updatedUser,
    });
  } catch (err) {
    return res.status(500).json({
      is_error: true,
      message: "Internal Server Error",
      error_message: err.message,
    });
  }
};

exports.updateFirebaseToken = async (req, res) => {
  console.log("Firebase token request");

  try {
    if (!req.userId) {
      return res
        .status(401)
        .json({ is_error: true, message: "Please Re-Login" });
    }

    const user = await Users.findById(req.userId);
    if (!user) {
      return res.status(401).json({
        is_error: true,
        message: "You Are Not Authorized, Please Re-Login",
      });
    }

    if (!req.body.firebaseToken) {
      return res.status(400).json({
        is_error: true,
        message: "Please provide the Firebase token",
        error_message: "Please provide the Firebase token",
      });
    }

    const updatedUser = await Users.findByIdAndUpdate(
      user._id,
      {
        firebase_token: req.body.firebaseToken,
      },
      { new: true }
    );

    return res.json({
      is_error: false,
      message: "Profile token updated",
      data: updatedUser,
    });
  } catch (err) {
    return res.status(500).json({
      is_error: true,
      message: "Internal Server Error",
      error_message: err.message,
    });
  }
};

exports.getOnline = async (req, res) => {
  try {
    if (!req.userId) {
      return res
        .status(401)
        .json({ is_error: true, message: "Please Re-Login" });
    }

    const user = await Users.findById(req.userId).select('isOnline -_id');;
    if (!user) {
      return res.status(401).json({
        is_error: true,
        message: "You Are Not Authorized, Please Re-Login",
      });
    }
    return res.json({
      is_error: false,
      message: "Profile found",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      is_error: true,
      message: "Internal Server Error",
      error_message: err.message,
    });
  }
};


exports.testFirebase = async (req, res) => {
  try {
    if (req.body.contact_no && req.body.title && req.body.message) {
      const user = await Users.findOne({
        contact_no: req.body.contact_no
      });
      if (!user) {
        return res.status(404).json({
          is_error: true,
          message: "User not found",
        });
      }

      const notificationMsg = {
        title: req.body.title,
        msg: req.body.message
      };
      let saveMessage = true;
      if (req.body.save_message) {
        if (req.body.save_message === "false" || req.body.save_message === false) {
          saveMessage = false
        }
      }

      let sendMessage = false;
      if (req.body.send_message) {
        if (req.body.send_message === "true" || req.body.send_message === true) {
          sendMessage = true
        }
      }
      sendNotification(user._id, notificationMsg, saveMessage, sendMessage);

      res.send({
        is_error: false, message: "notification sent", data: {
          saveMessage,
          sendMessage
        }
      });
    } else {
      return res.status(400).json({
        is_error: true,
        message: "please send contact_no, title, message  in body"
      });
    }
  } catch (error) {
    return res.status(500).json({
      is_error: true,
      message: "Internal Server Error",
      error_message: err.message,
    })
  }
}
exports.updateDriverStatus = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { status } = req.body;

    if (!driverId || !status) {
      return res.status(400).json({
        is_error: true,
        message: "Bad Request",
        error_message: "Both driverId and status are required in the request body.",
      });
    }

    // Check if the provided status is valid
    if (status !== "active" && status !== "deactivate") { // Changed "deactivate" to "inactive" for consistency
      return res.status(400).json({
        is_error: true,
        message: "Bad Request",
        error_message: "Invalid status. It should be either 'active' or 'inactive'.",
      });
    }

    // Find the driver by id
    const driver = await Users.findById(driverId);

    // If driver not found
    if (!driver) {
      return res.status(404).json({
        is_error: true,
        message: "Not Found",
        error_message: "Driver not found with the provided id.",
      });
    }

    // Update driver status
    driver.status = status;
    await driver.save();

    res.json({
      success: true,
      data: driver,
      message: `Driver status updated successfully to ${status}.`,
    });
  } catch (err) {
    return res.status(500).json({
      is_error: true,
      message: "Internal Server Error",
      error_message: err.message,
    });
  }
};


exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params; // Corrected
    const { status } = req.body;

    // Validate input
    if (!userId || !status) {
      return res.status(400).json({
        is_error: true,
        message: "Bad Request",
        error_message: "Both UserId and status are required in the request body.",
      });
    }

    // Check if the provided status is valid
    if (status !== "active" && status !== "deactivate") { // Changed "deactivate" to "inactive" for consistency
      return res.status(400).json({
        is_error: true,
        message: "Bad Request",
        error_message: "Invalid status. It should be either 'active' or 'inactive'.",
      });
    }

    // Find the driver by id
    const user = await Users.findById(userId);

    // If driver not found
    if (!user) {
      return res.status(404).json({
        is_error: true,
        message: "Not Found",
        error_message: "User not found with the provided id.",
      });
    }

    // Update driver status
    user.status = status;
    await user.save();

    res.json({
      success: true,
      data: user,
      message: `User status updated successfully to ${status}.`,
    });
  } catch (err) {
    return res.status(500).json({
      is_error: true,
      message: "Internal Server Error",
      error_message: err.message,
    });
  }
};
exports.getTransactionHistory = async (req, res) => {
  const { userId, driverId } = req.query;
  const parsedQuery = req._parsedUrl.query;

  // Extracting the page parameter from the parsed query string
  const page = parsedQuery ? parseInt(parsedQuery.split('=')[1]) || 1 : 1;

  try {
    const pageLimit = 20;

    // Fetch transaction history based on the provided userId or driverId
    let transactionHistory;
    if (userId) {
      transactionHistory = await Rides.find({ userId: userId });
    } else if (driverId) {
      transactionHistory = await Rides.find({ driverId: driverId });
    } else {
      transactionHistory = await Rides.find();
    }

    if (!transactionHistory || transactionHistory.length === 0) {
      return res.status(404).json({
        is_error: true,
        message: "No transaction history found for the provided user ID or driver ID.",
      });
    }

    // Calculate the startIndex and endIndex for pagination
    const startIndex = (page - 1) * pageLimit;
    const endIndex = page * pageLimit;

    // Slice the transaction history array to get the paginated data
    const paginatedTransactions = transactionHistory.slice(startIndex, endIndex);

    // Fetch user data for all users in the transaction history
    const userIds = paginatedTransactions.map(transaction => transaction.userId);
    const usersData = await Users.find({ _id: { $in: userIds } }).lean().exec();
    const usersMap = usersData.reduce((acc, user) => {
      acc[user._id] = user;
      return acc;
    }, {});

    // Fetch driver data for all drivers in the transaction history
    const driverIds = paginatedTransactions.map(transaction => transaction.driverId);
    const driversData = await Users.find({ _id: { $in: driverIds } }).lean().exec();
    const driversMap = driversData.reduce((acc, driver) => {
      acc[driver._id] = driver;
      return acc;
    }, {});

    // Combine transaction history with user and driver data
    const transactionsWithData = paginatedTransactions.map(transaction => {
      return {
        ...transaction.toObject(),
        user: usersMap[transaction.userId],
        driver: driversMap[transaction.driverId]
      };
    });

    // Return transaction history with embedded driver and user details along with pagination metadata
    return res.json({
      is_error: false,
      message: 'Transaction history found',
      data: transactionsWithData,
      meta: {
        total: transactionHistory.length,
        current_page: page,
        total_page: Math.ceil(transactionHistory.length / pageLimit),
        per_page: pageLimit
      }
    });
  } catch (err) {
    return res.status(422).json({
      is_error: true,
      message: "Please Try again later.",
      error_message: err.message,
    });
  }
};

exports.getUserRole = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        is_error: true,
        message: "You Are Not Authorized",
      });
    }
    const user = await Users.findById(req.userId).select("role");
    if (!user) {
      return res.status(404).json({
        is_error: true,
        message: "User not found",
      });
    }
    return res.json({
      is_error: false,
      message: "User role found",
      role: user.role,
    });
  } catch (err) {
    console.error("Error getting user role:", err);
    return res.status(500).json({
      is_error: true,
      message: "Internal Server Error",
      error_message: err.message,
    });
  }
};

