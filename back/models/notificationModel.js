"use strict";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    icon: { type: String, required: true },
    message: { type: String, required: true },
    date: { type: Date, default: Date.now },
    type: { type: String, enum: ['success', 'info', 'danger', 'warning'], required: true },
    isViewed: { type: Boolean, default: false }
}, {
    timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
