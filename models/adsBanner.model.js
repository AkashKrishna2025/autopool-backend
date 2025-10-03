module.exports = (mongoose) => {
  const adsBanner = mongoose.model(
    "adsBanner",
    mongoose.Schema(
      {
        image: { type: String, required: true },
        imageName: { type: String, required: true },
        imageKey: { type: String, required: true },
        type: { type: String, required: true }, //ads , banner
        forType: { type: String, default: "both" }, //driver, user , both
        status: { type: String, default: "active" },
      },
      { timestamps: true }
    )
  );

  return adsBanner;
};
