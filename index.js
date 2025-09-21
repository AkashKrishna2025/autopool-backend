const express = require('express');

const _ = require("lodash");
var bodyParser = require('body-parser');
require('dotenv').config();
const { app, server } = require('./socket/socket');
var cors = require('cors');
app.use(cors());


var methodOverride = require("method-override");

// allow overriding methods in query (?_method=put)
app.use(methodOverride("X-HTTP-Method-Override"));
app.use(methodOverride("_method"));



// parse application/json
app.use(bodyParser.json());

// for parsing application/xwww-
app.use(bodyParser.urlencoded({ extended: false }));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "*");
  next();
});

app.get("/", (req, res) => {
  res.send("Auto Pool Apis Server");
});

server.listen(process.env.PORT, () => {
  console.log(`App listening on port ${process.env.PORT}`)
})

var multer = require("multer");
var upload = multer({
  storage: multer.memoryStorage(),
  // limits: { fileSize: 1024 * 1024 * 250 },
  fileFilter: function (req, file, done) {
    if (
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/webp"
    ) {
      done(null, true);
    } else {
      //prevent the upload
      /* var newError = new Error("File type is incorrect - " + file.mimetype);
      newError.name = "MulterError";
      done(newError, false); */
      done(null, true);
    }
  },
});


app.use(function (req, res, next) {
  let queryParams = _.pickBy(req.query, (i) => !_.isEmpty(i));
  req.query = queryParams;
  
  const pageNumber = req.query.page || 1;
  const pageLimit = parseInt(req.query.limit) || 20;
  const order_by = req.query.order_by ?? "created_at";
  const order_in = req.query.order_in ?? "desc";

  delete req.query.page;
  delete req.query.order_by;
  delete req.query.order_in;
  delete req.query.limit;

  global.pageNumber = pageNumber;
  global.pageLimit = pageLimit;
  global.orderByColumn = order_by.concat("." + order_in).split(".");
  next();
});

const db = require("./models/index");
const { startCronJobs } = require('./controllers/cron');

db.mongoose
  .connect(db.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to the database!");
  })
  .catch((err) => {
    console.log("Cannot connect to the database!", err);
    process.exit();
  });

//Routes
//require("./routes/users.routes")(app);

startCronJobs();

app.use("/auth", upload.any(), require("./routes/auth.routes"));
app.use("/state", upload.any(), require("./routes/state.routes"));
app.use("/city", upload.any(), require("./routes/city.routes"));
app.use("/user", upload.any(), require("./routes/users.routes"));
app.use("/contact_us", upload.any(), require("./routes/contactus.routes"));
app.use("/dashboard", upload.any(), require("./routes/dashboard.routes"));
app.use("/faq", upload.any(), require("./routes/faq.routes"));
app.use("/adsBanner", upload.any(), require("./routes/adsBanner.routes"));
app.use("/discountCoupon", upload.any(), require("./routes/discountCoupon.routes"));
app.use("/location", upload.any(), require("./routes/location.routes"));
app.use("/ride", upload.any(), require("./routes/rides.routes"));
app.use("/fare", upload.any(), require("./routes/fare.routes"));
app.use("/notification", upload.any(), require("./routes/notifications.routes"));
app.use("/address", upload.any(), require("./routes/address.routes"));
app.use("/wallet", upload.any(), require("./routes/wallet.routes"));

app.use("/ticket", upload.any(), require("./routes/userComplaints.routes"));


const moment = require("moment");
