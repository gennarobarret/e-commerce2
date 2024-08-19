"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DiscountSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    percentage: {
        type: Number,
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: false
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: false
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("Discount", DiscountSchema);
