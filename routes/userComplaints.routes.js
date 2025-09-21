const express = require("express");
const router = express.Router();
const tickets = require("../controllers/userComplaints.controller");

// middleware that is specific to this router
const verifyAuth = require("../middleware/authorization");

router.post("/raiseTicket/", verifyAuth.verifyAnyUser, tickets.raiseTicket);
router.post("/chat/:ticketNumber", verifyAuth.verifyAnyUser, tickets.chat);
router.get("/allChats/:ticketNumber", verifyAuth.verifyAnyUser, tickets.allChats);

router.get("/allTickets/", verifyAuth.verifyAnyUser, tickets.allTickets);

router.put("/:ticketNumber", verifyAuth.verifyAdmin, tickets.updateStatus);
router.delete("/:ticketNumber", verifyAuth.verifyAdmin, tickets.delete);

router.get("/detail/:ticketNumber/", verifyAuth.verifyAnyUser, tickets.detail);

module.exports = router;