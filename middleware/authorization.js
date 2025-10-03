const jwt = require("jsonwebtoken");
require("dotenv").config();

const Authorization = class {
  async verifyAnyUser(req, res, next) {
    try {
      console.log(req.headers["authorization"]);
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];
      if (!token) {
        console.log("Token Not Found");
        return res
          .status(401)
          .json({ is_error: true, message: "You Are Not Authorized" });
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (payload?.id) {
        req.userId = payload.id;
        req.userRole = payload.role;
        next();
      } else {
        return res
          .status(401)
          .json({ is_error: true, message: "You Are Not Authorized" });
      }
    } catch (err) {
      console.error(err.message);
      return res.status(401).json({
        is_error: true,
        message: "You Are Not Authorized",
        error_message: err.message,
      });
    }
  }

  async verifyUser(req, res, next) {
    try {
      console.log(req.headers["authorization"]);
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];
      if (!token) {
        console.log("Token Not Found");
        return res
          .status(401)
          .json({ is_error: true, message: "You Are Not Authorized" });
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      // console.log({ payload })
      if (payload.role == "user") {
        req.userId = payload.id;
        req.userRole = payload.role;
        next();
      } else {
        console.log("Not User");
        return res
          .status(401)
          .json({ is_error: true, message: "You Are Not Authorized" });
      }
    } catch (err) {
      console.error(err.message);
      return res.status(401).json({
        is_error: true,
        message: "You Are Not Authorized",
        error_message: err.message,
      });
    }
  }

  async verifyDriver(req, res, next) {
    try {
      //console.log("verifyDriver")
      console.log(req.headers["authorization"]);
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];
      if (!token) {
        console.log("Token Not Found");
        return res
          .status(401)
          .json({ is_error: true, message: "You Are Not Authorized" });
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      console.log({ payload })

      if (payload.role == "driver") {
        req.userId = payload.id;
        req.userRole = payload.role;
        req.tokenData = payload;
        next();
      } else {
        console.log("Not Driver");
        return res
          .status(401)
          .json({ is_error: true, message: "You Are Not Authorized" });
      }
    } catch (err) {
      console.error(err.message);
      return res.status(401).json({
        is_error: true,
        message: "You Are Not Authorized",
        error_message: err,
      });
    }
  }

  async verifyAdmin(req, res, next) {
    try {
      console.log(req.headers["authorization"]);
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];
      if (!token) {
        console.log("Token Not Found");
        return res
          .status(401)
          .json({ is_error: true, message: "You Are Not Authorized" });
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (payload.role != "admin") {
        console.log("Not Admin");
        return res
          .status(401)
          .json({ is_error: true, message: "You Are Not Authorized" });
      }
      req.userId = payload.id;
      req.userRole = payload.role;
      next();
    } catch (err) {
      console.error(err.message);
      return res.status(401).json({
        is_error: true,
        message: "You Are Not Authorized",
        error_message: err.message,
      });
    }
  }

  async verifyAdminOrDriver(req, res, next) {
    try {
      console.log(req.headers["authorization"]);
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];
      if (!token) {
        console.log("Token Not Found");
        return res
          .status(401)
          .json({ is_error: true, message: "You Are Not Authorized" });
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (payload.role != "admin" && payload.role != "driver") {
        console.log("Not admin or driver");
        return res
          .status(401)
          .json({ is_error: true, message: "You Are Not Authorized" });
      }
      req.userId = payload.id;
      req.userRole = payload.role;
      next();
    } catch (err) {
      console.error(err.message);
      return res.status(401).json({
        is_error: true,
        message: "You Are Not Authorized",
        error_message: err.message,
      });
    }
  }

  async verifyRefreshTokenUserOrDriver(req, res, next) {
    try {
      console.log(req.headers["authorization"]);
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];
      if (!token) {
        console.log("Token Not Found");
        return res
          .status(401)
          .json({ is_error: true, message: "You Are Not Authorized" });
      }

      const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

      if (payload.role == "user" || payload.role == "driver") {
        req.userId = payload.id;
        req.userRole = payload.role;
        next();
      } else {
        console.log("Not Guest Or User");
        return res
          .status(401)
          .json({ is_error: true, message: "You Are Not Authorized" });
      }
    } catch (err) {
      console.error(err.message);
      return res.status(401).json({
        is_error: true,
        message: "You Are Not Authorized",
        error_message: err.message,
      });
    }
  }
};

module.exports = new Authorization();
