const express = require("express");
const router = express.Router();
const discountCoupon = require("../controllers/discountCoupon.controller");

// middleware that is specific to this router
const verifyAuth = require("../middleware/authorization");

router.get("/", verifyAuth.verifyAnyUser, discountCoupon.list);
router.get("/:type", verifyAuth.verifyAnyUser, discountCoupon.list);
router.get("/:id", verifyAuth.verifyAnyUser, discountCoupon.detail);

// Only admin can modify
router.post("/", verifyAuth.verifyAdmin, discountCoupon.create);
router.put("/:id", verifyAuth.verifyAdmin, discountCoupon.update);
router.delete("/:id", verifyAuth.verifyAdmin, discountCoupon.delete);

module.exports = router;
