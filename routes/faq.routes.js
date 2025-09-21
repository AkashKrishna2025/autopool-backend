const express = require("express");
const router = express.Router();
const Faq = require("../controllers/faq.controller");

// middleware that is specific to this router
const verifyAuth = require("../middleware/authorization");

router.get("/", verifyAuth.verifyAnyUser, Faq.list);
router.get("/:id", verifyAuth.verifyAnyUser, Faq.detail);

// Only admin can modify
router.put("/:id", verifyAuth.verifyAdmin, Faq.update);
router.post("/", verifyAuth.verifyAdmin, Faq.create);
router.delete("/:id", verifyAuth.verifyAdmin, Faq.delete);

module.exports = router;
