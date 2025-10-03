module.exports = (mongoose) => {
  const discountCoupon = mongoose.model(
    "discountCoupon",
    mongoose.Schema(
      {
        code: { type: String, required: true },
        discountUpto: { type: String, required: true },
        validity: { type: String, required: true },
        type: { type: String, required: true },

        validFrom: { type: String, required: true },
        validFrom_int: { type: Number, required: true },

        validTo: { type: String, required: true },
        validTo_int: { type: Number, required: true },

        totalUsage: { type: Number, required: true, default: 0 },
        currentUsage: { type: Number, required: true, default: 0 },
        status: { type: String, required: true },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "users",
          required: true,
        },
        // addedFor: { type: String, required: true },
      },
      { timestamps: true }
    )
  );

  return discountCoupon;
};
