const db = require("../models");
const { generateRandomStrings, uploadToS3, uploadToGCS, sendOtpMessage } = require("../lib/helpers");
const Users = db.users;
const auth = require("../lib/auth");
const Otp = db.otp;
const bcrypt = require("bcrypt");

const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);

exports.send_otp = async (req, res) => {
  try {
    if (!req.body.contact_no) {
      return res.status(400).json({
        is_error: true,
        message: "Please enter contact number",
        error_message: "Please enter contact number",
      });
    }
    
    const contact_no = req.body.contact_no;
    const userData = await Users.findOne({ contact_no: contact_no });
    const isNewUser = !userData;
    let userType = "new";
    if (userData) {
      userType = userData?.role;
    }

    const randomOtp = Math.floor(1000 + Math.random() * 9000);
    console.log(`Generated OTP for ${contact_no}: ${randomOtp}`);
    
    // Try standard approach first
    let otpResp = await sendOtpMessage(contact_no, randomOtp);
    
    // If that fails, try alternative approach
    if (otpResp && otpResp.includes && otpResp.includes("Invalid Parameters")) {
      console.log("Standard approach failed, trying alternative...");
      otpResp = await sendOtpMessageAlt(contact_no, randomOtp);
    }
    
    // Even if SMS fails, still create the OTP record
    const otpToken = contact_no + "autopool" + randomOtp;
    const otp = new Otp({
      otp: randomOtp,
      contact_no: contact_no,
      otpToken: otpToken
    });

    await Otp.updateMany(
      { contact_no: contact_no, is_expired: false },
      { is_expired: true }
    );

    await otp.save();

    // For testing, you can still continue even if SMS fails
    return res.json({
      is_error: false,
      message: "OTP generated: " + randomOtp, // Include OTP in response for testing
      isNewUser: isNewUser,
      userType: userType,
      otpResp,
      testOtp: randomOtp // Add this for testing purposes only, remove in production
    });
  } catch (err) {
    console.error("OTP Generation Error:", err);
    return res.status(500).json({
      is_error: true,
      message: "Unable to generate OTP, please try again later.",
      error_message: err.message,
    });
  }
};
exports.verify_otp = async (req, res) => {
  console.log("Verify OTP request");

  try {
    if (!req.body.contact_no || !req.body.otp) {
      return res.status(400).json({
        is_error: true,
        message: "Please enter contact number and OTP",
        error_message: "Please enter contact number and OTP",
      });
    }

    const contact_no = req.body.contact_no;
    const verify_otp = req.body.otp;
    const otpToken = contact_no + "autopool" + verify_otp;

    const result = await Otp.findOneAndUpdate(
      {
        is_verified: false,
        is_expired: false,
        otpToken: otpToken,
      },
      {
        is_verified: true,
        is_expired: true,
      }
    );

    if (result) {
      const userData = await Users.findOne({
        contact_no: contact_no,
        status: { $ne: "deleted" },
      });

      if (userData) {
        if (userData?.status === "active") {
          const tokenData = {
            id: userData._id,
            name: userData.name,
            email: userData.email,
            contact_no: userData.contact_no,
            role: userData.role,
            isAdmin: userData.isAdmin,
            country: userData.country,
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt,
          };
          const access_token = auth.generateToken(tokenData);
          const refresh_token = auth.generateRefreshToken(tokenData);

          return res.json({
            is_error: false,
            message: "OTP matched and logged in",
            isNewUser: false,
            data: userData,
            access_token: access_token,
            refresh_token: refresh_token,
          });
        } else {
          return res.status(403).json({
            is_error: true,
            message: "Please contact admin to login to your account",
            isNewUser: false,
          });
        }
      } else {
        await Otp.updateOne(
          { _id: result._id },
          { is_verified: false, is_expired: false }
        );

        return res.json({
          is_error: false,
          message: "OTP matched",
          isNewUser: true,
        });
      }
    } else {
      return res.status(401).json({
        is_error: true,
        message: "OTP not matched",
        error_message: "OTP not matched",
      });
    }
  } catch (err) {
    return res.status(500).json({
      is_error: true,
      message: "Unable to verify OTP, please try again later.",
      error_message: err.message,
    });
  }
};

exports.register = async (req, res) => {
  console.log("User registration request check");

  try {
    if (!req.body.contact_no || !req.body.name || !req.body.otp) {
      console.log("required feilds are missing ", req.body);
      return res.status(400).json({
        is_error: true,
        message: "Please fill all mandatory fields",
        error_message: "Please fill all mandatory fields",
      });
    }

    const existingUser = await Users.findOne({
      contact_no: req.body.contact_no,
    }).exec();
    if (existingUser) {
      console.log("existing user contact");
      return res.status(409).json({
        is_error: true,
        message: "User with contact number already exists",
      });
    }

    const existingUserEmail = await Users.findOne({
      email: req.body.email,
    }).exec();
    if (existingUserEmail) {
      console.log("existing user email");
      return res
        .status(409)
        .json({ is_error: true, message: "User with email already exists" });
    }

    const contact_no = req.body.contact_no;
    const verify_otp = req.body.otp;
    const otpToken = contact_no + "autopool" + verify_otp;

    const otpRes = await Otp.findOneAndUpdate(
      {
        is_verified: false,
        is_expired: false,
        otpToken: otpToken,
      },
      {
        is_verified: true,
        is_expired: true,
      }
    );

    if (otpRes) {
      if (req.files && req.files[0]?.fieldname === "profile_image") {
        const file = req.files[0];
        const fileNameAr = file.originalname.split(".");
        const fileExt = fileNameAr[fileNameAr.length - 1];
        const curDate = new Date().toISOString().slice(0, 10);
        const fileName =
          generateRandomStrings(10) +
          "-" +
          Date.now().toString() +
          "." +
          fileExt;
        const fileFolder = process.env.AWS_FOLDERNAME + "Users";
        const fileNameFull = fileFolder + "/" + curDate + "/" + fileName;
        /* const s3out = await uploadToS3(
          file.buffer,
          fileNameFull,
          file.mimetype
        ); */
        const s3out = await uploadToGCS(
          file.buffer,
          fileNameFull,
          file.mimetype
        );
        req.body.profile_img = s3out?.Location;
        req.body.profile_img_key = fileNameFull;
        req.body.profile_img_name = fileName;
      }

            let initialStatus = 'active';
      if (req.body.userRole === 'driver') {
        initialStatus = 'deactivate';
      }

      const newUser = new Users({
        name: req.body.name,
        email: req.body.email,
        contact_no: req.body.contact_no,
        role: req.body.userRole,
        profile_img: req.body.profile_img,
        profile_img_key: req.body.profile_img_key,
        profile_img_name: req.body.profile_img_name,
        gender: req.body.gender,
        city: req.body.city,
                status: initialStatus, // Set the status here
      });

      const userData = await newUser.save();

      const tokenData = {
        id: userData._id,
        name: userData.name,
        email: userData.email,
        contact_no: userData.contact_no,
        profile_img: userData.profile_img,
        profile_img_key: userData.profile_img_key,
        profile_img_name: userData.profile_img_name,
        role: userData.role,
        isAdmin: userData.isAdmin,
        gender: userData.gender,
        city: userData.city,
        country: userData.country,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      };

      const access_token = auth.generateToken(tokenData);
      const refresh_token = auth.generateRefreshToken(tokenData);
      console.log("reg req success");
      return res.json({
        is_error: false,
        message: "User registration successful",
        data: userData,
        access_token: access_token,
        refresh_token: refresh_token,
      });
    } else {
      console.log("otp not matched");
      return res.status(401).json({

        is_error: true,
        message: "OTP not matched",
        error_message: "OTP not matched",
      });
    }
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      is_error: true,
      message: "Unable to register user, please try again later.",
      error_message: err.message,
    });
  }
};

exports.generateTokenFromRefresh = async (req, res) => {
  console.log("Refresh token request");

  try {
    if (!req.userId) {
      return res
        .status(404)
        .json({ is_error: true, message: "You Are Not Authorized" });
    }

    const userData = await Users.findOne({ _id: req.userId });

    if (userData) {
      const tokenData = {
        id: userData._id,
        name: userData.name,
        email: userData.email,
        contact_no: userData.contact_no,
        role: userData.role,
        isAdmin: userData.isAdmin,
        gender: userData.gender,
        city: userData.city,
        country: userData.country,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      };

      const access_token = auth.generateToken(tokenData);
      const refresh_token = auth.generateRefreshToken(tokenData);

      return res.json({
        is_error: false,
        message: "Refresh Token Generated",
        access_token: access_token,
        refresh_token: refresh_token,
      });
    } else {
      return res.status(401).json({
        is_error: true,
        message: "You Are Not Authorized, Please Re-Login",
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(422).json({
      is_error: true,
      message: "You Are Not Authorized, Please Re-Log",
      error_message: err.message,
    });
  }
};

exports.adminLogin = async (req, res) => {
  console.log("Admin Login request");

  try {
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({
        is_error: true,
        message: "Please enter email and password",
        error_message: "Please enter email and password",
      });
    }

    const email = req.body.email;
    const password = req.body.password;

    const userData = await Users.findOne({ role: "admin", email: email });

    if (userData) {
      const isPasswordValid = await bcrypt.compare(password, userData.password);

      if (isPasswordValid) {
        const tokenData = {
          id: userData._id,
          name: userData.name,
          email: userData.email,
          contact_no: userData.contact_no,
          role: userData.role,
          isAdmin: userData.isAdmin,
          country: userData.country,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
        };

        const access_token = auth.generateToken(tokenData);
        const refresh_token = auth.generateRefreshToken(tokenData);

        return res.json({
          is_error: false,
          message: "Logged in successfully",
          isNewUser: false,
          data: userData,
          access_token: access_token,
          refresh_token: refresh_token,
        });
      } else {
        return res.status(401).json({
          is_error: true,
          message: "Please enter correct password.",
          error_message: "Please enter correct password.",
        });
      }
    } else {
      return res.status(401).json({
        is_error: true,
        message: "User not found.",
        error_message: "User not found.",
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(422).json({
      is_error: true,
      message: "Please try again later.",
      error_message: err.message,
    });
  }
};
exports.addAdminLogin = async (req, res) => {
  if (!req.body.email && !req.body.password) {
    res.status(400).json({
      is_error: true,
      message: "Please fill all mandatory fields",
      error_message: "Please fill all mandatory fields",
    });
    return;
  } else {
    if (req.body.password) {
      req.body.password = bcrypt.hashSync(req.body.password, salt);
    }

    const newUser = new Users({
      name: req.body.name,
      email: req.body.email,
      role: "admin",
      password: req.body.password,
    });

    newUser
      .save()
      .then((userData) => {
        res.json({
          is_error: false,
          message: "Admin Added successful",
          data: userData,
        });
      })
      .catch((err) => {
        res.status(422).json({
          is_error: true,
          message: "Please Try again later.",
          error_message: err.message,
        });
      });
  }
};
