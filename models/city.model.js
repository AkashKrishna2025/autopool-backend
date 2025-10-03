module.exports = (mongoose) => {
  const Cities = mongoose.model(
    "cities",
    mongoose.Schema(
      {
        name: { type: String, required: false },
        state_id: { type: mongoose.Schema.Types.ObjectId, ref: "states" },
        state_name: { type: String, required: false },
        status: { type: String, default: "active" },
      },
      { timestamps: true }
    )
  );

  return Cities;
};
