const express = require("express");
const router = express.Router();
const Address = require("../controllers/address.controller");

// middleware that is specific to this router
const verifyAuth = require("../middleware/authorization");

router.get("/",verifyAuth.verifyAnyUser, Address.list);
router.get("/details/", verifyAuth.verifyAnyUser, Address.detail);
router.put("/:id", verifyAuth.verifyAnyUser, Address.update);
router.post("/", verifyAuth.verifyAnyUser, Address.create);
router.delete("/:id", verifyAuth.verifyAnyUser, Address.delete);

module.exports = router;