"use strict";

const mongoose = require('mongoose');
const Country = require("../models/countriesModel");
const State = require("../models/statesModel");

const { handleErrorResponse, handleSuccessfulResponse } = require('../helpers/responseManagerHelper');

// GET ALL COUNTRIES
const getAllCountries = async (req, res) => {
    try {
        const countries = await Country.find({});
        handleSuccessfulResponse("Countries retrieved successfully", countries)(req, res);
    } catch (error) {
        handleErrorResponse(error, req, res);
    }
};

// GET ALL STATES
const getAllStates = async (req, res) => {
    try {
        const states = await State.find({}).populate('country');
        handleSuccessfulResponse("States/provinces/districts retrieved successfully", states)(req, res);
    } catch (error) {
        handleErrorResponse(error, req, res);
    }
};

// GET STATES BY COUNTRY
const getStatesByCountry = async (req, res) => {
    const { countryId } = req.params;
    console.log(`Fetching states for countryId: ${countryId}`);
    try {
        const countryObjectId = new mongoose.Types.ObjectId(countryId);
        console.log(`Converted countryId to ObjectId: ${countryObjectId}`);

        const states = await State.find({ country: countryObjectId }).populate('country');
        console.log(`States found: ${states.length}`);
        if (states.length === 0) {
            handleSuccessfulResponse("No states/provinces/districts found for this country", states)(req, res);
        } else {
            handleSuccessfulResponse("States retrieved successfully", states)(req, res);
        }
    } catch (error) {
        console.error(error);
        handleErrorResponse(error, req, res);
    }
};

module.exports = {
    getAllCountries,
    getAllStates,
    getStatesByCountry
};
