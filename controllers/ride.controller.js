const axios = require("axios");
const polyline = require("polyline");
const { decode } = require("@googlemaps/polyline-codec");
const { io } = require("../socket/socket");

const db = require("../models");
const {
  getPaginate,
  sendNotification,
  getNotification,
  generateSharedRideId,
  getCurrentTimestamp,
  generateReceiptId,
} = require("../lib/helpers");
const { forIn, map } = require("lodash");
const { isDate } = require("moment");

const LocationHistoryModel = db.UserLocationHistory;
const UserModel = db.users;

const RideModel = db.Rides;
const VehicleModel = db.Vehicles;

const City = db.City;
const State = db.State;
const FareModel = db.Fare;

const Payments = db.Payments;

let baseFarePrivate = 59;
let baseFareKmPrivate = 3;
let perMeterPrivateFare = 20 / 1000;

let baseFareShare = 29;
let baseFareKmShare = 3;
let perMeterShareFare = 10 / 1000;

const maxDistanceVal = 200000;

const maxPersonsInShared = 3;

const Razorpay = require("razorpay");
process.env.TZ = "Asia/Kolkata";

const moment = require("moment");
const rideModel = require("../models/ride.model");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const getCityStateDetails = async (latlng) => {
  try {
    const geocodeResponse = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: {
          latlng: latlng,
          key: process.env.GOOGLE_API_KEY,
        },
      }
    );

    const AddressComponents =
      geocodeResponse.data.results[0].address_components;
    const cityName = AddressComponents.find((component) =>
      component.types.includes("administrative_area_level_3")
    ).long_name;
    const stateName = AddressComponents.find((component) =>
      component.types.includes("administrative_area_level_1")
    ).long_name;

    let CityStateId = await City.findOne({
      name: cityName,
      state_name: stateName,
      status: "active",
    }).select("_id state_id");

    return { cityName, stateName, CityStateId };
  } catch (error) {
    console.error("Error fetching city and state details:", error);
    throw error;
  }
};
const routeForsingleSource = async (pickPoint, dropPoint) => {
  try {
    console.log({ pickPoint, dropPoint });
    let latLngPath = [];

    const apiKey = process.env.GOOGLE_API_KEY;
    const origin = {
      location: { latLng: pickPoint },
    };
    const destination = {
      location: { latLng: dropPoint },
    };
    const travelMode = "DRIVE";
    const routing_preference = "TRAFFIC_AWARE";

    let routeResponse = await axios.post(
      `https://routes.googleapis.com/directions/v2:computeRoutes?key=${apiKey}`,
      {
        origin,
        destination,
        travelMode,
        routing_preference,
      },
      {
        headers: {
          "X-Goog-FieldMask":
            "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline",
        },
      }
    );

    if (routeResponse?.statusText == "OK") {
      const encodedPolyline =
        routeResponse?.data?.routes[0]?.polyline.encodedPolyline;
      const decodedPolyline = decode(encodedPolyline);
      latLngPath = decodedPolyline.map(([lat, long]) => ({ lat, long }));
    }
    return latLngPath;
  } catch (error) {
    console.error("Error fetching routes:", error);
    throw error;
  }
};
const routeForMultipleSource = async (sources, destination) => {
  try {
    console.log("routeForMultipleSource---->", { sources, destination });
    const axios = require("axios");

    const apiKey = process.env.GOOGLE_API_KEY;

    const baseUrl = "https://maps.googleapis.com/maps/api/directions/json";
    const waypoints = sources
      .map((source) => `${source.lat},${source.lng}`)
      .join("|");
    const url = `${baseUrl}?origin=${sources[0].lat},${sources[0].lng}&destination=${destination.lat},${destination.lng}&waypoints=${waypoints}&key=${apiKey}`;

    // console.log({ waypoints, url });
    let response = await axios.get(url);
    let result = response.data;

    if (result.status === "OK") {
      const routes = result.routes;

      const encodedPolyline = routes[0]?.overview_polyline.points;
      const decodedPolyline = decode(encodedPolyline);

      let latLngPath = decodedPolyline.map(([lat, long]) => ({ lat, long }));

      return latLngPath;
    } else {
      console.error("Error fetching directions:", result.status);
    }
  } catch (error) {}
};

exports.createHistory = async (req, res) => {
  try {
    const userDetail = await UserModel.findOne({ _id: req.userId }).select(
      "status"
    );
    // console.log(userDetail);
    if (userDetail?.status !== "active") {
      return res.status(400).json({
        is_error: true,
        message: "Your account is suspended please contact support/admin.",
        error_message: userDetail,
      });
    }

    if (
      !req.body.pick_longitude ||
      !req.body.pick_latitude ||
      !req.body.drop_longitude ||
      !req.body.drop_latitude
    ) {
      return res.status(400).json({
        is_error: true,
        message: "Please provide both latitude and longitude.",
        error_message: "Please provide both latitude and longitude.",
      });
    }

    const origin = `${req.body.pick_latitude},${req.body.pick_longitude}`;
    const destination = `${req.body.drop_latitude},${req.body.drop_longitude}`;

    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/distancematrix/json",
      {
        params: {
          origins: origin,
          destinations: destination,
          key: process.env.GOOGLE_API_KEY,
        },
      }
    );

    const status = response.data?.rows[0]?.elements[0].status;

    if (status === "OK") {
      const pickGeocode = await getCityStateDetails(origin);
      // const dropGeocode = await getCityStateDetails(destination);
      const dropGeocode = {};

      // const privateFare = await FareModel.findOne({
      //     state_id: pickGeocode?.CityStateId?.state_id,
      //     city_id: pickGeocode?.CityStateId?._id,
      //     vehicleType: 'private'
      // }).select('baseKm baseKmFare perKmFare');

      // const sharedFare = await FareModel.findOne({
      //     state_id: pickGeocode?.CityStateId?.state_id,
      //     city_id: pickGeocode?.CityStateId?._id,
      //     vehicleType: 'share'
      // }).select('baseKm baseKmFare perKmFare');

      const distanceText = response.data?.rows[0]?.elements[0]?.distance?.text;
      const distanceValue =
        response.data?.rows[0]?.elements[0]?.distance?.value;
      let distanceUnit = "M";
      if (distanceValue >= 1000) {
        distanceUnit = "KM";
      }

      const distanceNumber = parseFloat(distanceText.replace(/[^\d.]/g, ""));

      const pickAddress = response.data.origin_addresses[0];
      const dropAddress = response.data.destination_addresses[0];

      let searchPrivateFare = Math.round(distanceValue * perMeterPrivateFare);
      if (baseFarePrivate > searchPrivateFare) {
        searchPrivateFare = baseFarePrivate;
      }
      let searchShareFare = Math.round(distanceValue * perMeterShareFare);
      if (baseFareShare > searchShareFare) {
        searchShareFare = baseFareShare;
      }

      const saveData = {
        userId: req.userId,
        pickLocation: {
          type: "Point",
          coordinates: [
            parseFloat(req.body.pick_longitude),
            parseFloat(req.body.pick_latitude),
          ],
        },
        pickAddress: pickAddress,
        pickGeocode,

        dropLocation: {
          type: "Point",
          coordinates: [
            parseFloat(req.body.drop_longitude),
            parseFloat(req.body.drop_latitude),
          ],
        },
        dropAddress: dropAddress,
        dropGeocode,

        distance: distanceNumber,
        distanceValue: distanceValue,
        distanceUnit: distanceUnit,
        distanceText: distanceText,

        private_fare: {
          base_fare: baseFarePrivate,
          base_fare_km: baseFareKmPrivate,
          search_fare: Math.round(searchPrivateFare),
        },
        share_fare: {
          base_fare: baseFareShare,
          base_fare_km: baseFareKmShare,
          search_fare: Math.round(searchShareFare),
        },
      };

      const savedLocation = await LocationHistoryModel.create(saveData);
      let responseData = {};
      if (distanceValue < maxDistanceVal) {
        responseData = {
          is_error: false,
          message: "Search result found",
          data: {
            searchId: savedLocation?._id,
            pick_location: pickAddress,
            drop_location: dropAddress,
            total_distance: distanceText,
            fare: {
              private_fare: savedLocation.private_fare,
              share_fare: savedLocation.share_fare,
            },
          },
          searchResponse: response.data,
        };
      } else {
        console.log("distance = ", distanceValue, "max = ", maxDistanceVal);
        responseData = {
          is_error: true,
          message: "Ride for more than 200 KM is not serviceable",
        };
      }
      res.status(201).json(responseData);
    } else {
      res.status(400).json({
        is_error: true,
        message: "Ride for more than 200 KM is not serviceable",
      });
    }
  } catch (error) {
    console.error("Search fare error -> ", error);
    res.status(500).json({
      is_error: true,
      message: "Internal server error.",
      error_message: error.message,
    });
  }
};
exports.searchRide = async (req, res) => {
  try {
    if (!req.body.searchId || !req.body.vehicle_type || !req.body.payMode) {
      if (!req.body.searchId) {
        return res.status(400).json({
          is_error: true,
          message: "Please search for source and destination first.",
          error_message: "Please provide search id.",
        });
      }
      if (!req.body.vehicle_type) {
        return res.status(400).json({
          is_error: true,
          message: "Please select vehicle to search for drivers.",
          error_message: "Please provide vehicle type.",
        });
      }
      if (!req.body.payMode) {
        return res.status(400).json({
          is_error: true,
          message: "Please select payment mode before ride.",
        });
      }
    }

    // check for search history
    const searchHistory = await LocationHistoryModel.findOne({
      _id: req.body.searchId,
    });

    // check if search history is there
    if (!searchHistory) {
      return res.status(404).json({
        is_error: true,
        message: "Please search for source and destination first.",
        error_message: "unable to find search history",
      });
    }

    let ride = await RideModel.findOne({
      searchHistory_id: req.body.searchId,
    });

    let seats = req.body.seats;
    let payMode = req.body.payMode;
    let vehicle_type = req.body.vehicle_type;

    // if ride not created than create new ride
    if (!ride) {
      // let SharedRideId = generateSharedRideId();
      ride = await RideModel.create({
        userId: req.userId,
        pickLocation: searchHistory.pickLocation,
        pickAddress: searchHistory.pickAddress,
        dropLocation: searchHistory.dropLocation,
        dropAddress: searchHistory.dropAddress,
        distance: searchHistory.distance,
        distanceValue: searchHistory.distanceValue,
        distanceUnit: searchHistory.distanceUnit,
        distanceText: searchHistory.distanceText,
        vehicleType: req.body.vehicle_type,
        searchHistory_id: searchHistory._id,

        payMode: payMode,
        payStatus: "pending",

        rideDate: parseInt(moment().format("DDMMYYYY")),
        rideWeek: parseInt(moment().week()),
        rideYear: parseInt(moment().format("YYYY")),
        rideMonth: parseInt(moment().format("MM")),
      });
    }

    // Drivers filter criteria
    let driverFilter = {
      role: "driver",
      isOnline: true,
    };

    let isSharedRide = false;

    if (
      req.body.vehicle_type === "share" ||
      req.body.vehicle_type === "Share"
    ) {
      vehicle_type = "shared";
      isSharedRide = true;
    }

    //find all drivers id from vehicle table
    let driversWithVehicles = [];
    let vehicleFindCriteria = {
      vehicle_type: vehicle_type,
      status: "active",
      // seat_offering: { $lte: seats }
    };

    if (isSharedRide) {
      let rideFindCreteria = { vehicleType: "share", status: "started" };
      let coordinates = ride?.pickLocation?.coordinates;

      if (coordinates) {
        rideFindCreteria.pickLocation = {
          $near: {
            $geometry: { type: "Point", coordinates: coordinates },
            // $maxDistance: 1000,
          },
        };
      }

      let currentlyRunningRides = await RideModel.find(rideFindCreteria).select(
        "driverId"
      );
      if (currentlyRunningRides?.length > 0) {
        console.log("running rides find", {
          rideFindCreteria,
          currentlyRunningRides,
        });
        driversWithVehicles = currentlyRunningRides.map(
          (ride) => ride.driverId
        );
        // driverFilter.isOnRide = true;
      } else {
        driversWithVehicles = await VehicleModel.distinct(
          "driver_id",
          vehicleFindCriteria
        );
      }
    } else {
      driversWithVehicles = await VehicleModel.distinct(
        "driver_id",
        vehicleFindCriteria
      );
    }

    let rideInfo = {
      rideId: ride._id,
      pickAddress: ride.pickAddress,
      dropAddress: ride.dropAddress,
      vehicleType: vehicle_type,
      distance: searchHistory.distanceText,
      SharedRideId: ride.SharedRideId,
    };
    rideInfo.seats = seats;

    let OnlineDrivers = await UserModel.find({
      _id: { $in: driversWithVehicles },
      ...driverFilter,
    }).select("_id socketId");

    console.log({ vehicleFindCriteria, driversWithVehicles, OnlineDrivers });

    if (OnlineDrivers?.length === 0) {
      return res.status(400).json({
        is_error: true,
        message: "Sorry, No nearby drivers found. Please try again later",
        error_message: "No nearby drivers are online",
      });
    }

    if (req.body.vehicle_type === "private") {
      rideInfo.fare = searchHistory.private_fare;
    } else {
      rideInfo.fare = searchHistory.share_fare;
    }

    OnlineDrivers?.map((driver, index) => {
      io.to(driver.socketId).emit("new_ride_available", rideInfo);
    });

    const responseData = {
      is_error: false,
      message: "Waiting for captain to accept request.",
      OnlineDrivers,
      data: rideInfo,
      searchHistory,
      ride,
    };

    res.json(responseData);
  } catch (error) {
    console.error("search ride error -> ", error);
    res.status(500).json({
      is_error: true,
      message: "Internal server error.",
      error_message: error.message,
    });
  }
};
// to accept the ride
exports.acceptRide = async (req, res) => {
  try {
    if (!req.body.rideId) {
      return res.status(400).json({
        is_error: true,
        message: "Please select ride first.",
        error_message: "Please provide ride id.",
      });
    }

    const driverId = req.userId;
    const userDetail = await UserModel.findOne({ _id: driverId }).select(
      "status"
    );
    // console.log(userDetail);
    if (userDetail?.status !== "active") {
      return res.status(400).json({
        is_error: true,
        message: "Your account is suspended please contact support/admin.",
        error_message: userDetail,
      });
    }

    let ride = await RideModel.findOne({
      _id: req.body.rideId,
      status: "pending",
    }).populate({
      path: "userId",
      model: "users",
    });

    if (!ride) {
      //to check ride is booked or not
      ride = await RideModel.findOne({
        _id: req.body.rideId,
        status: "booked",
        driverId: driverId,
      }).populate({
        path: "userId",
        model: "users",
      });

      if (!ride) {
        return res.json({
          is_error: true,
          message: "Better luck next time! You missed the opportunity.",
        });
      }
    }
    let vehicleInfo = await VehicleModel.find({
      driver_id: driverId,
      status: "active",
    });

    let seatOffering = 1;

    if (vehicleInfo) {
      seatOffering = vehicleInfo.seatOffering;
    }
    let getSharedRideInfo = [];
    let currentUserInShared = [];
    let SharedRideId = generateSharedRideId();

    // if accepted ride is "shared" then check current user in shared ride
    if (ride.vehicleType == "share" || ride.vehicleType == "Share") {
      getSharedRideInfo = await RideModel.findOne({
        driverId: req.userId,
        status: "started",
      }).select("SharedRideId");

      if (getSharedRideInfo) {
        SharedRideId = getSharedRideInfo.SharedRideId;
      }

      currentUserInShared = await RideModel.find({
        SharedRideId,
      });

      if (currentUserInShared?.length >= seatOffering) {
        return res.json({
          is_error: true,
          message: `Only maximum ${maxPersonsInShared} is allowed in shared. shared auto limit is full.`,
        });
      }
    }

    ride.SharedRideId = SharedRideId;

    const randomOtp = Math.floor(1000 + Math.random() * 9000);
    const endOtp = Math.floor(1000 + Math.random() * 9000);

    ride.driverId = driverId;
    ride.status = "booked";
    ride.otp = randomOtp;
    ride.endOtp = endOtp;

    await ride.save();

    const rideInfo = {
      rideId: ride._id,
      distance: ride.distanceText,
      pickLocation: ride.pickLocation,
      pickAddress: ride.pickAddress,
      dropLocation: ride.dropLocation,
      dropAddress: ride.dropAddress,
      otp: randomOtp,
      status: "booked",
      sharedRideInfo: {
        currentUserInShared: currentUserInShared.length,
        seatOffering: seatOffering,
      },
      SharedRideId: ride.SharedRideId,
    };
    console.log({ rideInfo });

    const driverData = await UserModel.findOne({ _id: driverId });

    driverData.isOnRide = true;
    //await driverData.save();
    rideInfo.captainInfo = {
      name: driverData.name,
      contact_no: driverData.contact_no,
      location: driverData.lastLocation,
    };
    rideInfo.vehicleInfo = vehicleInfo;
    // const titleRes = "Ride Accepted"
    const notificationMsg = {
      title: "Ride Accepted",
      msg: `Your ride has been accepted by ${driverData.name}`,
    };

    if (ride && ride.userId && ride.userId.socketId) {
      sendNotification(ride.userId, notificationMsg);
      io.to(ride.userId.socketId).emit(
        "ride_accepted_notification",
        notificationMsg
      );
    }

    res.json({
      is_error: false,
      message: "Ride successfully accepted.",
      ride,
      driverData,
      notification: notificationMsg,
    });
  } catch (error) {
    console.error("except ride error -> ", error);
    res.status(500).json({
      is_error: true,
      message: "Internal server error.",
      error_message: error.message,
    });
  }
};
exports.rideDetail = async (req, res) => {
  try {
    if (!req.params.rideId) {
      return res.status(400).json({
        is_error: true,
        message: "Please select ride first.",
        error_message: "Please provide ride id.",
      });
    }
    // console.log(req.params);
    let rideId = req.params.rideId;
    let ride = await RideModel.findOne({
      _id: rideId,
    }).populate([
      {
        path: "userId",
        model: "users",
      },
      {
        path: "driverId",
        model: "users",
      },
    ]);

    if (!ride) {
      return res.status(404).json({
        is_error: true,
        message: "Please check ride again",
        error_message: "unable to find this ride",
      });
    }
    console.log({ ride });
    const driverId = ride.driverId._id;

    const rideNotifications = await getNotification(ride);

    const vehicleInfo = await VehicleModel.find({
      driver_id: driverId,
    });
    const respData = {
      is_error: false,
      message: "Ride detail found",
      data: {
        rideInfo: ride,
        vehicleInfo,
        rideNotifications,
      },
    };
    let currentUserInShared = {};
    if (ride.vehicleType) {
      currentUserInShared = await RideModel.find({
        SharedRideId: ride.SharedRideId,
      }).populate({
        path: "userId",
        model: "users",
      });
      respData.currentUserInShared = currentUserInShared;
    }

    res.json(respData);
  } catch (error) {
    console.error("ride detail error -> ", error);
    res.status(500).json({
      is_error: true,
      message: "Internal server error.",
      error_message: error.message,
    });
  }
};
exports.sharedRideDetail = async (req, res) => {
  try {
    if (!req.params.SharedRideId) {
      return res.status(400).json({
        is_error: true,
        message: "Please select shared ride first.",
        error_message: "Please provide shared ride id.",
      });
    }

    let rides = await RideModel.find({
      SharedRideId: req.params.SharedRideId,
      status: { $ne: "Completed" },
    })
      .populate([
        {
          path: "userId",
          model: "users",
        },
        {
          path: "driverId",
          model: "users",
        },
      ])
      .lean();

    if (rides.length == 0) {
      return res.status(404).json({
        is_error: true,
        message: "Please check ride again",
        error_message: "unable to find this ride",
      });
    }

    for (let i = 0; i < rides.length; i++) {
      let sharedRide = rides[i];

      let driverId = sharedRide.driverId;
      let rideNotifications;
      let vehicleInfo;
      if (driverId) {
        rideNotifications = await getNotification(sharedRide);
        vehicleInfo = await VehicleModel.findOne({
          driver_id: driverId,
        });
      }

      rides[i].rideNotifications = rideNotifications;
      rides[i].vehicleInfo = vehicleInfo;
      // console.log({ i, vehicleInfo, sharedRide });
    }

    const respData = {
      is_error: false,
      message: "Ride detail found",
      data: rides,
    };

    res.json(respData);
  } catch (error) {
    console.error("ride detail error -> ", error);
    res.status(500).json({
      is_error: true,
      message: "Internal server error.",
      error_message: error.message,
    });
  }
};
exports.startRide = async (req, res) => {
  try {
    const time = moment().format("hh:mm A");
    const date = moment().format("DD MMMM YYYY");
    if (!req.body.rideId || !req.body.rideOtp) {
      if (!req.body.rideId) {
        return res.status(400).json({
          is_error: true,
          message: "Please select ride first.",
          error_message: "Please provide ride id.",
        });
      }
      if (!req.body.rideOtp) {
        return res.status(400).json({
          is_error: true,
          message: "Otp needed to start ride",
          error_message: "Please provide ride otp.",
        });
      }
    }

    let ride = await RideModel.findOne({
      _id: req.body.rideId,
      status: "booked",
    }).populate([
      {
        path: "userId",
        model: "users",
      },
      {
        path: "driverId",
        model: "users",
      },
    ]);

    if (!ride) {
      return res.status(404).json({
        is_error: true,
        message: "Please check ride again",
        error_message: "unable to find this ride",
      });
    }

    if (ride.otp !== req.body.rideOtp) {
      return res.status(400).json({
        is_error: true,
        message: "OTP Mismatch! Please ask customer to re-check otp.",
        error_message: "otp not matched.",
      });
    }

    ride.status = "started";
    ride.rideStart_timeDate = { time, date };

    await ride.save();

    let rideInfo = {
      rideId: ride._id,
      distance: ride.distanceText,
      pickLocation: ride.pickLocation,
      pickAddress: ride.pickAddress,
      dropLocation: ride.dropLocation,
      dropAddress: ride.dropAddress,
      dropAddress: ride.dropAddress,
      status: "started",
      endOtp: ride.endOtp,
      SharedRideId: ride.SharedRideId,
    };

    const driverId = ride.driverId._id;
    const vehicleInfo = await VehicleModel.find({
      driver_id: driverId,
    });

    rideInfo.captainInfo = {
      name: ride.driverId.name,
      contact_no: ride.driverId.contact_no,
      location: ride.driverId.lastLocation,
    };
    rideInfo.vehicleInfo = vehicleInfo;

    if (ride && ride.userId && ride.userId.socketId) {
      let check = io.to(ride.userId.socketId).emit("ride_excepted", rideInfo);
      io.to(ride.userId.socketId).emit("ride_started", rideInfo);
      io.to(ride.driverId.socketId).emit("ride_detail", rideInfo);

      console.log("ride_excepted", { rideInfo, check });
    }

    const respData = {
      is_error: false,
      message: "Ride started",
      data: {
        rideInfo: ride,
      },
    };

    res.json(respData);
  } catch (error) {
    console.error("confirm ride error -> ", error);
    res.status(500).json({
      is_error: true,
      message: "Internal server error.",
      error_message: error.message,
    });
  }
};
exports.list = async (req, res) => {
  try {
    var condition = {};

    if (!req.query.status) {
      condition.status = {
        $ne: "pending",
      };
    } else {
      condition.status = req.query.status;
    }
    if (req.userRole === "user") {
      condition.userId = req.userId;
    }
    //
    if (req.query.vehicleType) {
      condition.vehicleType = req.query.vehicleType;
    }

    if (req.userRole === "driver") {
      condition.driverId = req.userId;
    }
    const allRides = await RideModel.find(condition)
      .populate([
        {
          path: "userId",
          model: "users",
        },
        {
          path: "driverId",
          model: "users",
        },
      ])
      .skip(pageLimit * pageNumber - pageLimit)
      .sort({ createdAt: "desc" })
      .limit(pageLimit)
      .lean()
      .exec();
    const count = await RideModel.countDocuments(condition).exec();
    const paginationData = getPaginate(allRides, count, pageNumber, pageLimit);
    res.json(paginationData);
  } catch (error) {
    console.error("ride list error -> ", error);
    res.status(500).json({
      is_error: true,
      message: "Internal server error.",
      error_message: error.message,
    });
  }
};
exports.endRide = async (req, res) => {
  try {
    const time = moment().format("hh:mm A");
    const date = moment().format("DD MMMM YYYY");

    if (!req.body.rideId || !req.body.latitude || !req.body.longitude) {
      if (!req.body.rideId) {
        return res.status(400).json({
          is_error: true,
          message: "Please select ride first.",
          error_message: "Please provide ride id.",
        });
      }
      if (!req.body.latitude || !req.body.longitude) {
        return res.status(400).json({
          is_error: true,
          message: "Please try again later",
          error_message: "Please send current latitude and longitude.",
        });
      }
    }

    let rideFilter = {
      _id: req.body.rideId,
      driverId: req.userId,
    };
    let ride = await RideModel.findOne(rideFilter).populate([
      {
        path: "userId",
        model: "users",
      },
      {
        path: "driverId",
        model: "users",
      },
    ]);

    // throw new Error('check');
    if (!ride) {
      return res.status(404).json({
        is_error: true,
        message: "Please check ride again",
        error_message: "unable to find this ride",
      });
    }

    const driverId = ride?.driverId?._id;
    const userData = ride?.userId;

    const origin = `${ride?.pickLocation?.coordinates[1]},${ride?.pickLocation?.coordinates[0]}`;
    const destination = `${req.body.latitude},${req.body.longitude}`;

    const distresponse = await axios.get(
      "https://maps.googleapis.com/maps/api/distancematrix/json",
      {
        params: {
          origins: origin,
          destinations: destination,
          key: process.env.GOOGLE_API_KEY,
        },
      }
    );
    const status = distresponse.data?.rows[0]?.elements[0].status;
    let response = {};

    if (status === "OK") {
      const distanceInMeters =
        distresponse.data.rows[0].elements[0].distance.value;
      const distanceInKilometers = distanceInMeters / 1000;
      let distanceUnit = "M";
      if (distanceInMeters >= 1000) {
        distanceUnit = "KM";
      }
      const dropAddress = distresponse.data.destination_addresses[0];
      const startTime = ride?.updatedAt;
      const currentTime = new Date();
      const rideDurationInMillis = currentTime - startTime;
      const rideDurationInMinutes = rideDurationInMillis / (1000 * 60);
      const hours = Math.floor(rideDurationInMinutes / 60);
      const minutes = Math.round(rideDurationInMinutes % 60);
      let durationString = "";
      if (hours > 0) {
        durationString += hours + " hr";
        if (hours > 1) {
          durationString += "s";
        }
        durationString += " ";
      }
      if (minutes > 0) {
        durationString += minutes + " min";
      }
      let totalfare = 0;
      if (ride?.vehicleType === "Private") {
        totalfare = Math.round(perMeterPrivateFare * distanceInMeters);
        if (totalfare < baseFarePrivate) {
          totalfare = baseFarePrivate;
        }
      } else {
        totalfare = Math.round(perMeterShareFare * distanceInMeters);
        if (totalfare < baseFareShare) {
          totalfare = baseFareShare;
        }
      }

      ride.dropLocation = {
        type: "Point",
        coordinates: [req.body.longitude, req.body.latitude],
      };
      ride.dropAddress = dropAddress;
      ride.status = "completed";
      ride.distance = distanceInKilometers;
      ride.distanceValue = distanceInMeters;
      ride.distanceUnit = distanceUnit;
      ride.distanceText = distanceInKilometers;
      ride.durationInMin = rideDurationInMinutes;
      ride.durationText = durationString;
      ride.totalFare = totalfare;
      ride.cancelAllowed = false;

      ride.rideEnd_timeDate = { time, date };

      ride.save();

            let updateRide = await RideModel.findByIdAndUpdate(req.body.rideId, {
        status: "completed",
        rideEnd_timeDate: {
          time,
          date,
        },
      });

      // console.log({ updateRide });

      const rideInfo = {
        pickAddress: ride.pickAddress,
        dropAddress: dropAddress,
        status: "Completed",
        distanceText: distanceInKilometers,
        durationText: durationString,
        totalFare: totalfare,
        payMode: ride.payMode,
        payStatus: ride.payStatus,
        SharedRideId: ride.SharedRideId,
      };
      io.to(userData?.socketId).emit("ride_ended", rideInfo);
      response = {
        is_error: false,
        message: "Ride Ended",
        distanceInKilometers,
        fare: totalfare,
        fareText: "Rs. " + totalfare,
        VehicleType: ride?.vehicleType,
        rideDuration: durationString,
        rideInfo,
      };
      // if not any shared ride is running on drivers id than change drivers status;
      let populatedRides = [];
      if (ride.vehicleType != "private" || ride.vehicleType != "private") {
        const findRide = {
          SharedRideId: ride.SharedRideId,
          driverId: req.userId,
          status: "started",
        };
        let pendingRunningRides = await RideModel.find(findRide);
        console.log({ findRide, pendingRunningRides });
        populatedRides = await Promise.all(
          pendingRunningRides.map(async (pendingRide) => {
            const userId = pendingRide.userId;
            const userDetail = await UserModel.findOne({ _id: userId });
            return { ...pendingRide.toObject(), userDetail };
          })
        );
      }
      response.pendingRunningRides = populatedRides;

      if (populatedRides?.length == 0) {
        console.log(
          "no pending rides find drivers status updated--->",
          driverId
        );
        await UserModel.findByIdAndUpdate(driverId, {
          isOnRide: false,
          isOnline: true,
          lastOnline: new Date(),
          lastLocation: {
            type: "Point",
            coordinates: [req.body.longitude, req.body.latitude],
          },
        });
      }
    } else {
      response = {
        is_error: true,
        message: "Please try again later",
        distresponse: distresponse.data,
      };
    }
    res.json(response);
  } catch (error) {
    console.error("end ride error -> ", error);
    res.status(500).json({
      is_error: true,
      message: "Internal server error.",
      error_message: error.message,
    });
  }
};
exports.createPayment = async (req, res) => {
  try {
    const rideId = req.params.rideId;
    let ride = await RideModel.findOne({
      _id: rideId,
    });

    if (!ride) {
      return res.status(404).json({
        is_error: true,
        message: "Please check ride again",
        error_message: "Invalid ride id provided.",
      });
    }

    const totalFare = ride.totalFare;
    const options = {
      amount: totalFare * 100, // Amount in paisa (50000 paisa = ₹500)
      currency: "INR",
      receipt: generateReceiptId(),
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);
    console.log("payment order created on server ----> ", { order });

    res.json({
      is_error: false,
      message: "Payment successfully created",
      orderId: order.id,
      amount: order.amount,
      order,
    });
  } catch (error) {
    console.error("create payment error -> ", error);
    res.status(500).json({
      is_error: true,
      message: "Internal server error.",
      error_message: error.message,
    });
  }
};
exports.paymentSuccess = async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;

    // // Verify the payment signature
    // const generatedSignature = razorpay.webhooks.generateSignature(JSON.stringify(req.body));
    // if (generatedSignature !== signature) {
    //     return res.status(400).send('Invalid payment signature');
    // }

    const rideId = req.params.rideId;
    let ride = await RideModel.findOne({
      _id: rideId,
    });
    if (!ride) {
      return res.status(404).json({
        is_error: true,
        message: "Please check ride again",
        error_message: "Invalid ride id provided.",
      });
    }

    ride.payStatus = "completed";
    ride.save();

    const paymentData = await Payments.create({
      rideId: req.params.rideId,
      paymentId: paymentId,
      orderId: orderId,
      amount: ride.totalFare,
      // date: moment().format('DD-MM-YYYY'),
    });

    res.json({
      is_error: false,
      message: "Payment completed",
      paymentData,
    });
  } catch (error) {
    console.error("payment success error -> ", error);
    res.status(500).json({
      is_error: true,
      message: "Internal server error.",
      error_message: error.message,
    });
  }
};

exports.getRoute = async (req, res) => {
  try {
    if (!req.params.sharedRideId) {
      return res.status(400).json({
        is_error: true,
        message: "Please provide valid ride id.",
        error_message: "Ride id not find",
      });
    }

    // check for search history
    const condition = { SharedRideId: req.params.sharedRideId };

    const rideDetail = await RideModel.find(condition);
    const totalRides = await RideModel.countDocuments(condition).exec();
    // check if search history is there
    if (totalRides == 0) {
      return res.status(404).json({
        is_error: true,
        message: "Please provide valid ride id.",
        error_message: "Invalid ride",
      });
    }

    let routePath;

    if (totalRides === 1) {
      let source = {
        latitude: rideDetail[0]?.pickLocation.coordinates[1].toString(),
        longitude: rideDetail[0]?.pickLocation.coordinates[0].toString(),
      };
      let destination = {
        latitude: rideDetail[0]?.dropLocation.coordinates[1].toString(),
        longitude: rideDetail[0]?.dropLocation.coordinates[0].toString(),
      };
      routePath = await routeForsingleSource(source, destination);
    }

    if (totalRides > 1) {
      let pickData = rideDetail.map((ride) => ride.pickLocation.coordinates);
      let dropData = rideDetail.map((ride) => ride.dropLocation.coordinates);

      //console.log({ pickData, dropData });

      let sourceData = [];
      let destinationData = { lat: dropData[0][1], lng: dropData[0][0] };

      pickData.map((pickCord) => {
        sourceData.push({ lat: pickCord[1], lng: pickCord[0] });
      });

      // const sources = [
      //     { lat: 18.641400, lng: 72.872200 },
      //     { lat: 18.964700, lng: 72.825800 },
      //     // Add more source coordinates as needed
      // ];
      // const destination = { lat: 18.523600, lng: 73.847800 };

      routePath = await routeForMultipleSource(sourceData, destinationData);
      console.log("route ------- >", routePath);
    }

    res.json({
      is_error: false,
      message: "route details.",
      routePath,
      totalRides,
      rideDetail,
    });
  } catch (error) {
    console.error("get route error error -> ", error);
    res.status(500).json({
      is_error: true,
      message: "Internal server error.",
      error_message: error.message,
    });
  }
};

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180; // Convert degrees to radians
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

exports.checkRide = async (req, res) => {
  try {
    // Your current location coordinates (replace with your actual coordinates)
    const myLocation = {
      latitude: 23.2289402,
      longitude: 77.4169767,
    };

    // Google destination coordinates (replace with your actual coordinates)
    const destinations = [
      { name: "Destination A", latitude: 23.2287899, longitude: 77.4170055 },
      { name: "Destination B", latitude: 23.2289402, longitude: 77.4169767 },
      { name: "Destination C", latitude: 23.2515174, longitude: 77.4604942 },
    ];

    // Calculate distances from your location to each destination
    destinations.forEach((dest) => {
      dest.distance = calculateDistance(
        myLocation.latitude,
        myLocation.longitude,
        dest.latitude,
        dest.longitude
      );
    });

    // Sort destinations based on distance (ascending order)
    destinations.sort((a, b) => a.distance - b.distance);

    res.json({
      destinations,
    });
    // Print the sorted destinations
    console.log(
      "Sorted destinations based on distance from nearest to farthest:"
    );
    destinations.forEach((dest) => {
      console.log(`${dest.name}: ${dest.distance.toFixed(2)} km`);
    });
  } catch (error) {
    console.error("checkRide error -> ", error);
    res.status(500).json({
      is_error: true,
      message: "Internal server error.",
      error_message: error.message,
    });
  }
};
