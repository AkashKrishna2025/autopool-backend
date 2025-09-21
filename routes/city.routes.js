const express = require("express");
const router = express.Router();
const City = require("../controllers/city.controller");

// middleware that is specific to this router
const verifyAuth = require("../middleware/authorization");

router.get("/", City.list);
router.get("/:id", City.detail);
router.put("/:id", verifyAuth.verifyAdmin, City.update);
router.post("/", verifyAuth.verifyAdmin, City.create);
router.delete("/:id", verifyAuth.verifyAdmin, City.delete);

module.exports = router;