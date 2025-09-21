module.exports = (mongoose) => {
  const UserDocuments = mongoose.model(
    "user_documents",
    mongoose.Schema(
      {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
        document_type: { type: String, required: true }, //Adhar / License / Vehicle Insurance / Vehicle Registration
        document_number: { type: String, required: false },
        front_img: { type: String, required: false },
        front_img_key: { type: String, required: false },
        front_img_name: { type: String, required: false },
        back_img: { type: String, required: false },
        back_img_key: { type: String, required: false },
        back_img_name: { type: String, required: false },
        comment: { type: String, required: false },
        status: { type: String, default: "pending" }, //verified / pending
      },
      { timestamps: true }
    )
  );

  return UserDocuments;
};
