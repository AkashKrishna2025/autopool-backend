const express = require("express");
const router = express.Router();
const ContactUs = require("../controllers/contactUs.controller");

const verifyAuth = require("../middleware/authorization");

router.get("/", verifyAuth.verifyAdmin, ContactUs.findAll);
router.post("/", ContactUs.create);
router.delete("/:id", verifyAuth.verifyAdmin, ContactUs.delete);

module.exports = router;