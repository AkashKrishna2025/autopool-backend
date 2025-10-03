const express = require("express");
const router = express.Router();
const users = require("../controllers/users.controller");

const vehicle = require("../controllers/vehicle.controller");

const auth = require("../controllers/auth.controller");
const UserDocs = require("../controllers/userDocuments.controller");

// middleware that is specific to this router
const verifyAuth = require("../middleware/authorization");

const setDocApproved = (req, res, next) => {
  req.body.status = "approved";
  next();
};
const setDocReject = (req, res, next) => {
  req.body.status = "rejected";
  next();
};


// driver vehicle
router.patch("/drivers/vehicle/updateStatus/:_vehicle_id", verifyAuth.verifyAdminOrDriver, vehicle.updateStatus);
router.get("/drivers/vehicle/:_vehicle_id", verifyAuth.verifyAdminOrDriver, vehicle.view);
router.put("/drivers/vehicle/:_vehicle_id", verifyAuth.verifyAdminOrDriver, vehicle.update);
router.delete("/drivers/vehicle/:_vehicle_id", verifyAuth.verifyAdminOrDriver, vehicle.delete);
router.get("/drivers/vehicle", verifyAuth.verifyAdminOrDriver, vehicle.all);
router.post("/drivers/vehicle", verifyAuth.verifyAdminOrDriver, vehicle.add);

router.patch("/drivers/documents/reject/:id", verifyAuth.verifyAdmin, setDocReject, UserDocs.updateStatus);
router.patch("/drivers/documents/verify/:id", verifyAuth.verifyAdmin, setDocApproved, UserDocs.updateStatus);
router.get("/drivers/documents", verifyAuth.verifyAdminOrDriver, UserDocs.findAll);

router.get("/drivers", verifyAuth.verifyAdmin, users.driverList);
router.post("/drivers", verifyAuth.verifyDriver, UserDocs.create);

router.get("/profile", verifyAuth.verifyAnyUser, users.profile);

router.put("/update_profile", verifyAuth.verifyAnyUser, users.profileUpdate);
router.put("/update_pass", verifyAuth.verifyAdmin, users.updatePass);
router.put("/update_firebase_token", verifyAuth.verifyAnyUser, users.updateFirebaseToken);
router.post("/add_admin_user", auth.addAdminLogin);



router.get("/drivers/vehicle", verifyAuth.verifyAdminOrDriver, vehicle.all);
router.post("/drivers/vehicle", verifyAuth.verifyAdminOrDriver, vehicle.add);
router.put("/drivers/status/:driverId", verifyAuth.verifyAdmin, users.updateDriverStatus)
router.put("/status/:userId", verifyAuth.verifyAdmin, users.updateUserStatus)
router.get("/transactionHistory", verifyAuth.verifyAnyUser, users.getTransactionHistory)
router.get("/role", verifyAuth.verifyAnyUser, users.getUserRole)
router.get("/drivers/vehicle/:_vehicle_id", verifyAuth.verifyAdminOrDriver, vehicle.view);
router.put("/drivers/vehicle/:_vehicle_id", verifyAuth.verifyAdminOrDriver, vehicle.update);
router.delete("/drivers/vehicle/:_vehicle_id", verifyAuth.verifyAdminOrDriver, vehicle.delete);
router.patch("/drivers/vehicle/updateStatus/:_vehicle_id", verifyAuth.verifyAdminOrDriver, vehicle.updateStatus);

router.get("/get_online", verifyAuth.verifyDriver, users.getOnline);
router.post("/push_notification", users.testFirebase);

router.post("/push_notification", users.testFirebase);


router.get("/", verifyAuth.verifyAdmin, users.userList);
module.exports = router;