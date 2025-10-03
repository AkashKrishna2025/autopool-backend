module.exports = (mongoose) => {
  const Faq = mongoose.model(
    "faq",
    mongoose.Schema(
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
        faqType: { type: String, default: "both" },
        status: { type: String, default: "active" },
      },
      { timestamps: true }
    )
  );

  return Faq;
};
