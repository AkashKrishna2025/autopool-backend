module.exports = (mongoose) => {
  const userTickets = mongoose.model(
    "userTickets",
    mongoose.Schema(
      {
        ticketNumber: { type: String, required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
        status: { type: String, default: "pending" }, // active , deleted , completed , pending
        comment: { type: String, default: '' }
      },
      { timestamps: true }
    )
  );
  return userTickets;
};
