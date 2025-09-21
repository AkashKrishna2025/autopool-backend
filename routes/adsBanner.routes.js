const express = require("express");
const router = express.Router();
const adsBanner = require("../controllers/adsBanner.controller");

// middleware that is specific to this router
const verifyAuth = require("../middleware/authorization");

router.get("/", verifyAuth.verifyAnyUser, adsBanner.list);
router.get("/:type", verifyAuth.verifyAnyUser, adsBanner.list);
router.get("/:id", verifyAuth.verifyAnyUser, adsBanner.detail);

// Only admin can modify
router.post("/", verifyAuth.verifyAdmin, adsBanner.create);
router.put("/:id", verifyAuth.verifyAdmin, adsBanner.update);
router.delete("/:id", verifyAuth.verifyAdmin, adsBanner.delete);

module.exports = router;
