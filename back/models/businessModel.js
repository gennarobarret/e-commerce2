"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

var BusinessSchema = new Schema({
    businessName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    taxId: {
        type: String,
        required: true,
        trim: true,
        match: /^[A-Z0-9]+$/,
    },
    taxType: {
        type: String,
        required: true,
        trim: true,
        enum: ['IVA', 'ISR', 'OTHER'],
    },
    taxPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        validate: {
            validator: function (value) {
                return value >= 0 && value <= 100;
            },
            message: props => `${props.value} is not a valid tax percentage. It must be between 0 and 100.`
        }
    },
    paymentGateway: {
        type: String,
        required: true,
        enum: ['paypal', 'googlepay', 'stripe'],
        default: 'googlepay'
    },
    shippingService: {
        type: String,
        required: true,
        trim: true
    },
    companyEmail: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: function (email) {
                return /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email);
            },
            message: props => `${props.value} is not a valid email`
        }
    },
    countryAddress: {
        type: String,
        required: true,
        trim: true
    },
    stateAddress: {
        type: String,
        required: true,
        trim: true
    },
    currency: {
        type: String,
        required: true,
        trim: true
    },
    logo: {
        type: String,
        trim: true,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model("Business", BusinessSchema);
