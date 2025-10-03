const express = require("express");
const router = express.Router();
const Notification = require("../controllers/notifications.controller");

// middleware that is specific to this router
const verifyAuth = require("../middleware/authorization");

router.get("/", verifyAuth.verifyAnyUser ,Notification.detail);

module.exports = router;