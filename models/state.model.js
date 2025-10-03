module.exports = mongoose => {
  const States = mongoose.model(
    "states",
    mongoose.Schema(
      {
        name: { type: String, required: false },
        status: { type: String, default: "active" },
      },
      { timestamps: true }
    )
  );

  return States;
};