// authenticate.js

"use strict";
const jwt = require("jsonwebtoken");
const moment = require("moment");
const { ErrorHandler, handleErrorResponse } = require("../helpers/responseManagerHelper");
const secret = process.env.JWT_SECRET;

exports.auth = function (req, res, next) {
    if (!req.headers.authorization) {
        handleErrorResponse(new ErrorHandler(403, "Authorization header is missing"), req, res);
        return;
    }
    const token = req.headers.authorization.replace(/['"]+/g, "");

    try {
        const payload = jwt.verify(token, secret);
        if (payload.exp <= moment().unix()) {
            handleErrorResponse(new ErrorHandler(401, "Token has expired"), req, res);
            return;
        }

        req.user = payload;
        next();
    } catch (error) {
        handleErrorResponse(new ErrorHandler(403, "The token is invalid: " + error.message), req, res);
    }
};

