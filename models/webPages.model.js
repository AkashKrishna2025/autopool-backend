module.exports = (mongoose) => {
  const webPages = mongoose.model(
    "webPages",
    mongoose.Schema(
      {
        pageData: { type: String, default: "" },
        type: { type: String,default:"" },
      },
      { timestamps: true }
    )
  );

  return webPages;
};
