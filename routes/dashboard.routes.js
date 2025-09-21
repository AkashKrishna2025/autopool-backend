const express = require("express");
const router = express.Router();
const DashboardController = require("../controllers/dashboard.controller");

// middleware that is specific to this router
const verifyAuth = require("../middleware/authorization");

router.get("/kpi", verifyAuth.verifyAdmin, DashboardController.GetKpi);
router.get("/home", verifyAuth.verifyAdmin, DashboardController.home);


router.get("/page/:type", verifyAuth.verifyAnyUser, DashboardController.getPage);
router.put("/page/:type/:id", verifyAuth.verifyAdmin, DashboardController.updatePage);

module.exports = router;