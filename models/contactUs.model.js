module.exports = mongoose => {
  const ContactUs = mongoose.model(
    "contact_us",
    mongoose.Schema(
      {
        name: { type: String, required: false },
        contact: { type: String, required: false },
        email: { type: String, required: false },
        message: { type: String, required: false },
        bookingId: { type: String, required: false },
        status: { type: String, default: "new" },
      },
      { timestamps: true }
    )
  );

  return ContactUs;
};