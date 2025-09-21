module.exports = (mongoose) => {
  const Otp = mongoose.model(
    "otp",
    mongoose.Schema(
      {
        otp: { type: String, required: true },
        contact_no: { type: String, required: true },
        otpToken: { type: String, required: false },
        expired_on: { type: String, required: false },
        is_expired: { type: Boolean, default: false },
        is_verified: { type: Boolean, default: false },
        ip: { type: String, required: false },
      },
      { timestamps: true }
    )
  );

  return Otp;
};
