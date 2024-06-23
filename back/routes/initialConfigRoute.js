"use strict";

const express = require("express");
const InitialConfigController = require("../controllers/InitialConfigController");
const api = express.Router();

api.get("/InitialCheck", InitialConfigController.InitialCheck);

module.exports = api;
