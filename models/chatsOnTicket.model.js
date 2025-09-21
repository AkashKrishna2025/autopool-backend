module.exports = (mongoose) => {
  const chatsOnTicket = mongoose.model(
    "chatsOnTicket",
    mongoose.Schema(
      {
        ticketNumber: { type: String, required: true },
        message: { type: String, required: false, default: '' },
        msgSentBy: { type: String, required: false, default: '' },
        msgSentType: { type: String, required: false, default: '' },
        status: { type: String, required: false }
      },
      { timestamps: true }
    )
  );
  return chatsOnTicket;
};
