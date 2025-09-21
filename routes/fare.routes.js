const express = require("express");
const router = express.Router();
const FareController = require("../controllers/fare.controller");

// middleware
const verifyAuth = require("../middleware/authorization");

router.get("/", verifyAuth.verifyAnyUser, FareController.list);
router.get("/:id", verifyAuth.verifyAnyUser, FareController.detail);

// Only admin can modify
router.put("/:id", verifyAuth.verifyAdmin, FareController.update);
router.post("/", verifyAuth.verifyAdmin, FareController.create);
router.delete("/:id", verifyAuth.verifyAdmin, FareController.delete);

module.exports = router;
