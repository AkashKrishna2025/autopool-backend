module.exports = (mongoose) => {
  const Users = mongoose.model(
    "users",
    mongoose.Schema(
      {
        name: { type: String, required: true },
        email: { type: String, required: false },
        profile_img: { type: String, required: false },
        profile_img_key: { type: String, required: false },
        profile_img_name: { type: String, required: false },
        gender: { type: String, required: false },
        contact_no: { type: String, required: false },
        password: { type: String, required: false },
        isAdmin: {
          type: Boolean,
          default: function () {
            return this.role === "admin";
          },
        }, // Default isAdmin based on role
        role: { type: String, default: "user" }, // user / driver / admin
        country: { type: String, default: "India" },
        city: { type: String, default: "" },
        status: { type: String, default: "active" },
        default_lang: { type: String, default: "english" },
        firebase_token: { type: String, required: false },
        reg_ip: { type: String, required: false },
        last_ip: { type: String, required: false },
        isOnRide: { type: Boolean, default: false },
        isOnline: { type: Boolean, default: false },
        lastOnline: { type: Date, default: Date.now },
        socketId: { type: String, default: "", required: false },
        lastLocation: {
          type: { type: String, enum: ['Point'], default: 'Point' },
          coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
        },
        lastLocAccuracy: { type: Number, default: 0},
        lastLocHeading: { type: Number, default: 0},
      },
      { timestamps: true }
    )
  );

  return Users;
};
