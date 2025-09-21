module.exports = (mongoose) => {
  const Faq = mongoose.model(
    "payments",
    mongoose.Schema(
      {
        rideId: { type: String, required: true },
        paymentId: { type: String, required: true },
        orderId: { type: String, required: true },
        amount: { type: Number, default: 0 },
      },
      { timestamps: true }
    )
  );

  return Faq;
};
