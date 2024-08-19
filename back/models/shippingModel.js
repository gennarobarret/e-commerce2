"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ShippingSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true }
    },
    method: {
        type: String,
        enum: ['Standard', 'Express', 'Next Day'],
        required: true
    },
    trackingNumber: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: ['Pending', 'Shipped', 'In Transit', 'Delivered', 'Returned'],
        default: 'Pending'
    },
    shippingDate: {
        type: Date,
        required: false
    },
    deliveryDate: {
        type: Date,
        required: false
    }
}, { timestamps: true });

module.exports = mongoose.model("Shipping", ShippingSchema);
