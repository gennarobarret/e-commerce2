"use strict";
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Modelo de State
const stateSchema = new Schema({
    country: { type: Schema.Types.ObjectId, ref: 'Country', required: true },
    province_name: String,
    province_abbrev: String,
    community_name: String,
    community_Abbrev: String,
    latitude: Number,
    longitude: Number
});

module.exports = mongoose.model('State', stateSchema);