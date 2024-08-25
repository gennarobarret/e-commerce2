const express = require('express');
const api = express.Router();
const locationController = require('../controllers/LocationController');
const auth = require('../middlewares/authenticate');
const rbac = require('../middlewares/rbacMiddleware');

api.get('/countries', [auth.auth, rbac('read', 'location')], locationController.getAllCountries);
api.get('/states', [auth.auth, rbac('read', 'location')], locationController.getAllStates);
api.get('/states/country/:countryId', [auth.auth, rbac('read', 'location')], locationController.getStatesByCountry);

module.exports = api;
