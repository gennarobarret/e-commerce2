"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000 // Limitar la longitud del contenido para evitar abusos
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    isRead: {
        type: Boolean,
        default: false
    },
    readBy: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now }
    }],
    attachments: [{
        fileName: { type: String },
        filePath: { type: String }
    }],
    importance: {
        type: String,
        enum: ['low', 'normal', 'high'],
        default: 'normal'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true
});

// Método para marcar como leído por un usuario
MessageSchema.methods.markAsRead = function (userId) {
    if (!this.readBy.some(readEntry => readEntry.userId.equals(userId))) {
        this.readBy.push({ userId });
        this.isRead = true;
        this.save();
    }
};

module.exports = mongoose.model("Message", MessageSchema);
