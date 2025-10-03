const express = require("express");
const router = express.Router();
const Wallet = require("../controllers/wallet.controller");

// middleware that is specific to this router
const verifyAuth = require("../middleware/authorization");
router.post("/", verifyAuth.verifyAnyUser, Wallet.create);
router.get("/details/", verifyAuth.verifyAnyUser, Wallet.detail);



module.exports = router;