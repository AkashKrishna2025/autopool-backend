module.exports = (mongoose) => {
  const Vehicles = mongoose.model(
    "vehicle",
    mongoose.Schema(
      {
        vehicle_model: { type: String, required: true },
        reg_number: { type: String, required: true },
        purchase_year: { type: String, required: true },
        registration_number: { type: String, required: true },
        seat_offering: { type: Number, default: 1 },
        instruction: { type: String, required: false },
        vehicle_type: { type: String, default: "private", required: false }, // private / shared
        status: { type: String, default: "pending" }, // active , deleted , disable , pending
        comment: { type: String, default: "" },
        driver_id: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
      },
      { timestamps: true }
    )
  );
  return Vehicles;
};
