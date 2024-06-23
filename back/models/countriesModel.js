"use strict";
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Modelo de Country
const countrySchema = new Schema({
    name: String,
    iso3: String,
    iso2: String,
    prefix: String,
    capital: String,
    currency: String,
    currency_symbol: String,
    native: String,
    region: String,
    subregion: String,
    divGeo: String,
    address_format: Number,
    timezones: Array,
    translations: Object,
    latitude: String,
    longitude: String,
    emoji: String,
    emojiU: String
});

module.exports = mongoose.model('Country', countrySchema);
