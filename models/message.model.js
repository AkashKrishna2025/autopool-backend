module.exports = (mongoose) => {
  const Message = mongoose.model(
    "message",
    mongoose.Schema(
      {
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
        recieverId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
        message: { type: String, required: true }
      },
      { timestamps: true }
    )
  );

  return Message;
};
