const url = process.env.MONGO_URL;

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const db = {};
db.mongoose = mongoose;
db.url = url;

db.users = require("./users.model")(mongoose);
db.Vehicles = require("./vehicle.model")(mongoose);
db.otp = require("./otp.model")(mongoose);
db.State = require("./state.model")(mongoose);
db.City = require("./city.model")(mongoose);
db.ContactUs = require("./contactUs.model")(mongoose);
db.UserDocuments = require("./UserDocuments.model")(mongoose);
db.Faq = require("./faq.model")(mongoose);
db.adsBanner = require("./adsBanner.model")(mongoose);
db.discountCoupon = require("./discountCoupon.model")(mongoose);
db.LocationLog = require("./locationLog.model")(mongoose);
db.UserLocationHistory = require("./UserLocationHistory.model")(mongoose);
db.Rides = require("./ride.model")(mongoose);
db.Message = require("./message.model")(mongoose);
db.Fare = require("./fare.model")(mongoose);

db.userTickets = require("./userTickets.model")(mongoose);
db.chatsOnTicket = require("./chatsOnTicket.model")(mongoose);
db.webPages = require("./webPages.model")(mongoose);
db.Payments = require("./payment.model")(mongoose);
module.exports = db;
