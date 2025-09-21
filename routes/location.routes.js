const express = require("express");
const router = express.Router();
const LocationController = require("../controllers/location.controller");

// middleware that is specific to this router
const verifyAuth = require("../middleware/authorization");

router.post("/", verifyAuth.verifyAnyUser, LocationController.create);

module.exports = router;