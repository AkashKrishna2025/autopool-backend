const jwt = require("jsonwebtoken");
require("dotenv").config();

const Auth = class {
  constructor(req, res) {
    console.log(req);
  }

  generateToken(data) {
    var token = jwt.sign(data, process.env.JWT_SECRET, {
      expiresIn: 60 * 60 * 24 * 30,
    });
    return token;
  }

  verify(token, res) {
    let tokenStatus = jwt.decode(token, process.env.JWT_SECRET);
    if (!tokenStatus) {
      res.status("401").json({ is_error: true, message: "Login please." });
    }
    return tokenStatus;
  }

  generateRefreshToken(data) {
    var token = jwt.sign(data, process.env.JWT_REFRESH_SECRET, {
      expiresIn: 60 * 60 * 24 * 30,
    });
    return token;
  }

  verifyRefresh(token, res) {
    let tokenStatus = jwt.decode(token, process.env.JWT_REFRESH_SECRET);
    if (!tokenStatus) {
      res.status("401").json({ is_error: true, message: "Not Valid" });
    }
    return tokenStatus;
  }
};

module.exports = new Auth();
