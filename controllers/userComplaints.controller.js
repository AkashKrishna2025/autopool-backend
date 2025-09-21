const db = require("../models");
const {
  getPaginate,
  uploadToS3,
  generateRandomStrings,
} = require("../lib/helpers");

const userTickets = db.userTickets;
const chatOnTicket = db.chatsOnTicket;

const Users = db.users;

exports.raiseTicket = async (req, res) => {
  try {

    const datetime = new Date();
    const curDate = datetime.toISOString().slice(0, 10);
    const ticketNumber = generateRandomStrings(5) + "-" + Date.now().toString();
    let message = req.body.message;
    const newTicket = new userTickets({
      userId: req.userId,
      ticketNumber: ticketNumber,
      status: "pending"
    });

    const ticketInfo = await newTicket.save();
    if (ticketInfo) {


      const newChat = new chatOnTicket({
        ticketNumber: ticketNumber,
        message: message,
        msgSentBy: req.userId,
        msgSentType: req.userRole,
      });

      const chatInfo = await newChat.save();
    }
    return res.json({
      is_error: false,
      message: "Ticket raised",
      ticketInfo,
    });
  } catch (err) {
    return res.status(500).json({
      is_error: true,
      message: "Internal Server Error",
      error_message: err.message,
    });
  }
};
exports.chat = async (req, res) => {
  try {

    if (!req?.params?.ticketNumber) {
      res.status(400).json({
        is_error: true,
        message: "Please Provide ticket number to continue",
        error_message: "Please fill all mandatory fields",
      });
      return;
    }
    if (!req?.body?.message) {
      res.status(400).json({
        is_error: true,
        message: "Message is not clear",
        error_message: "Please fill all mandatory fields",
      });
      return;
    }

    let ticketNumber = req.params.ticketNumber;

    let ticket = await userTickets.findOne({ ticketNumber });

    if (!ticket) {
      res.status(400).json({
        is_error: true,
        message: "Please Provide valid ticket number",
        error_message: "Invalid Ticket number",
      });
      return;
    }

    let message = req.body.message;

    const newChat = new chatOnTicket({
      ticketNumber: ticketNumber,
      message: message,
      msgSentBy: req.userId,
      msgSentType: req.userRole,
    });

    const chatInfo = await newChat.save();

    return res.json({
      is_error: false,
      message: "Submitted.",
      chatInfo,
      ticket
    });
  } catch (err) {
    return res.status(500).json({
      is_error: true,
      message: "Internal Server Error",
      error_message: err.message,
    });
  }
};
exports.allChats = async (req, res) => {
  var condition = {};
  if (!req?.params?.ticketNumber) {
    return res.status(400).json({
      is_error: true,
      message: "Please Provide ticket number to continue",
      error_message: "Invalid ticket.",
    });
  }

  let ticketNumber = req.params.ticketNumber;
  let ticket = await userTickets.findOne({ ticketNumber });

  if (!ticket) {
    res.status(400).json({
      is_error: true,
      message: "Please Provide valid ticket number",
      error_message: "Invalid Ticket number",
    });
    return;
  }




  if (req.params.ticketNumber) {
    condition.ticketNumber = req.params.ticketNumber;
  }

  chatOnTicket.find(condition)
    .skip(pageLimit * pageNumber - pageLimit)
    .limit(pageLimit)
    .lean()
    .exec()
    .then(async (documents) => {
      if (documents.length > 0) {
        const count = await chatOnTicket.countDocuments(condition).exec();
        res.json(getPaginate(documents, count, pageNumber, pageLimit));
      } else {
        res.json(getPaginate([], 0, pageNumber, pageLimit));
      }
    })
    .catch((err) => {
      console.error("Error in findAll chats:", err);
      res.status(422).json({
        is_error: true,
        message: "Please try again later",
        error_message: err.message,
      });
    });
};



exports.detail = async (req, res) => {
  if (!req.params.ticketNumber) {
    res.status(400).json({
      is_error: true,
      message: "Please Select ticket first",
      error_message: "ticket number is not valid",
    });
    return;
  }

  userTickets.findOne({ ticketNumber: req.params.ticketNumber }).populate('userId')
    .then(async (data) => {
      return res.json({ is_error: false, message: "Ticket details found", data });
    })
    .catch((err) => {
      res.status(422).json({
        is_error: true,
        message: "Invalid ticket selected.",
        error_message: err.message,
      });
    });
};

exports.allTickets = async (req, res) => {
  var condition = {};
  if (req.userRole != "admin") {
    condition.userId = req.userId;
    condition.status = {
      $ne: "deleted",
    };
  }
  if (req.query.status) {
    condition.status = req.query.status;
  }




  userTickets.find(condition)
    .skip(pageLimit * pageNumber - pageLimit)
    .limit(pageLimit)
    .lean()
    .populate('userId')
    .exec()
    .then(async (documents) => {
      if (documents.length > 0) {
        const count = await userTickets.countDocuments(condition).exec();

        res.json(getPaginate(documents, count, pageNumber, pageLimit));
      } else {
        res.json(getPaginate([], 0, pageNumber, pageLimit));
      }
    })
    .catch((err) => {
      console.error("Error in findAll chats:", err);
      return res.status(422).json({
        is_error: true,
        message: "Please try again later",
        error_message: err.message,
      });
    });

};
exports.updateStatus = (req, res) => {
  if (!req?.params?.ticketNumber) {
    res.status(400).json({
      is_error: true,
      message: "Please Select ticket",
      error_message: "Please fill all mandatory fields",
    });
    return;
  }

  userTickets.findOneAndUpdate(
    { _id: req.params.ticketNumber },
    { status: req.body.status, comment: req.body.comment },
    { new: true }
  )
    .then(async (data) => {
      var message = "Document " + req.body.status;
      return res.json({ is_error: false, message });
    })
    .catch((err) => {
      res.status(422).json({
        is_error: true,
        message: "Please Try again later.",
        error_message: err.message,
      });
    });
};
exports.delete = (req, res) => {
  if (!req?.params?.ticketNumber) {
    res.status(400).json({
      is_error: true,
      message: "Please select document",
      error_message: "Please fill all mandatory fields",
    });
    return;
  }

  userTickets.findOneAndUpdate(
    { _id: req.params.ticketNumber },
    { status: "deleted" },
    { new: true }
  )
    .then(async (data) => {
      return res.json({ is_error: false, message: "Document deleted" });
    })
    .catch((err) => {
      res.status(422).json({
        is_error: true,
        message: "Please Try again later.",
        error_message: err.message,
      });
    });
};



