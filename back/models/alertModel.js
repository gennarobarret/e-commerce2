"use strict";
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AlertSchema = new Schema({
    type: {
        type: String,
        required: true,
        enum: ['info', 'warning', 'danger', 'success'],
        default: 'info'
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000 // Limitar la longitud del mensaje para evitar abusos
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
    isSeen: {
        type: Boolean,
        default: false
    },
    seenBy: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        seenAt: { type: Date, default: Date.now }
    }],
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true
});

// Añadir índices para mejorar el rendimiento de las consultas
AlertSchema.index({ timestamp: -1 }); // Índice descendente en el timestamp
AlertSchema.index({ type: 1 });
AlertSchema.index({ isSeen: 1 });
AlertSchema.index({ sender: 1 });


// Agregar método para marcar la alerta como vista
AlertSchema.methods.markAsSeen = function (userId) {
    if (!userId) {
        throw new Error('User ID is required to mark the alert as seen');
    }
    if (!this.seenBy.some(entry => entry.userId && entry.userId.equals(userId))) {
        this.seenBy.push({ userId });
        this.isSeen = true; // O actualiza el campo según sea necesario
        return this.save();
    }
    return Promise.resolve(this);
};

module.exports = mongoose.model("Alert", AlertSchema);
