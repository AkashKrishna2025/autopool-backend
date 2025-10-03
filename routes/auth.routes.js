const express = require("express");
const router = express.Router();
const auth = require("../controllers/auth.controller");

// middleware that is specific to this router
const verifyAuth = require("../middleware/authorization");

const setUserRole = (req, res, next) => {
  req.body.userRole = "user";
  next();
};
const setDriverRole = (req, res, next) => {
  req.body.userRole = "driver";
  next();
};

router.post("/send_otp", auth.send_otp);
router.post("/verify_otp", auth.verify_otp);

router.post("/register_user", setUserRole, auth.register);
router.post("/register_driver", setDriverRole, auth.register);

router.get("/refreshToken", verifyAuth.verifyRefreshTokenUserOrDriver, auth.generateTokenFromRefresh);
router.post("/admin_login", auth.adminLogin);


module.exports = router;