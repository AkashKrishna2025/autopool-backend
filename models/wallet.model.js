const mongoose = require('mongoose');
const WalletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  amount: { type: Number, required: true },
},
  { timestamps: true }
);
WalletSchema.index({ location: '2dsphere' });
const Wallet = mongoose.model('Wallet', WalletSchema);

module.exports = Wallet;
