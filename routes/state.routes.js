const express = require("express");
const router = express.Router();
const State = require("../controllers/state.controller");

// middleware that is specific to this router
const verifyAuth = require("../middleware/authorization");

router.get("/", State.list);
router.get("/:id", verifyAuth.verifyAdmin, State.detail);
router.put("/:id", verifyAuth.verifyAdmin, State.update);
router.post("/", verifyAuth.verifyAdmin, State.create);
router.delete("/:id", verifyAuth.verifyAdmin, State.delete);

module.exports = router;