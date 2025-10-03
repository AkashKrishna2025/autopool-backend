const express = require("express");
const router = express.Router();
const RideController = require("../controllers/ride.controller");
const MessageController = require("../controllers/message.controller");

// middleware that is specific to this router
const verifyAuth = require("../middleware/authorization");

router.post("/search", verifyAuth.verifyAnyUser, RideController.createHistory);
router.post("/firnd_drivers", verifyAuth.verifyUser, RideController.searchRide);
router.post("/except", verifyAuth.verifyDriver, RideController.acceptRide);
router.get("/detail/:rideId", verifyAuth.verifyAnyUser, RideController.rideDetail);
router.get("/detail/share/:SharedRideId", verifyAuth.verifyAnyUser, RideController.sharedRideDetail);
router.post("/start", verifyAuth.verifyDriver, RideController.startRide);
router.get("/", verifyAuth.verifyAnyUser, RideController.list);

router.get("/messages/:rideId", verifyAuth.verifyAnyUser, MessageController.getMessages);
router.post("/messages/:rideId", verifyAuth.verifyAnyUser, MessageController.sendMessage);

router.post("/end", verifyAuth.verifyDriver, RideController.endRide);


router.get("/createPayment/:rideId", RideController.createPayment);
router.put("/paymentSuccess/:rideId", RideController.paymentSuccess);


router.get("/getRoute/:sharedRideId", RideController.getRoute);

module.exports = router;
