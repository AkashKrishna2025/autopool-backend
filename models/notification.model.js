const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    msg: { type: String, required: false, },
    title: { type: String, required: false, },
    isNew: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
    ,
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
