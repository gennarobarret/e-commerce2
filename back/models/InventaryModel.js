
"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const InventarySchema = new Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantityInStock: {
        type: Number,
        required: true,
        default: 0
    },
    warehouseLocation: {
        type: String,
        trim: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model("Inventary", InventarySchema);
