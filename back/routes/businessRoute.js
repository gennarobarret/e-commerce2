"use strict";

const express = require("express");
const BusinessManagement = require("../controllers/BusinessController");
const api = express.Router();

api.post("/createBusiness", BusinessManagement.createBusiness);
api.put("/updateBusiness", BusinessManagement.updateBusiness);
api.get("/getBusiness", BusinessManagement.getBusiness);

module.exports = api;
