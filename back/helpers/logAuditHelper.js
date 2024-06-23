"use strict";

const mongoose = require('mongoose');
const AuditLog = require('../models/auditLogModel');
const User = require('../models/userModel');
const logger = require('./logHelper');
const { ErrorHandler } = require('../helpers/responseManagerHelper');


async function getUserNameById(userId) {
    try {
        const user = await User.findById(userId);
        return user ? user.userName : "UnknownUser";
    } catch (error) {
        console.error("Error retrieving user name:", error);
        return "UnknownUser";
    }
}

async function logAudit(action, by, targetDoc, targetType, alertLevel, message, ipAddress, apiPath) {
    try {
        if (!apiPath) {
            console.error("API Path is missing!");
            throw new Error("API Path is required for audit logging.");
        }
        // console.log("Creating audit log with apiPath:", apiPath);
        // console.log("Other details: ", { action, by, targetDoc, targetType, alertLevel, message, ipAddress });

        if (!by) {
            by = "UnknownUser";
        } else if (typeof by === 'object') {
            by = await getUserNameById(by);
        }

        const validTargetDoc = mongoose.Types.ObjectId.isValid(targetDoc) ? targetDoc : null;

        await AuditLog.create({
            action,
            by,
            targetDoc: validTargetDoc,
            targetType,
            alertLevel,
            apiPath,
            details: { message },
            ipAddress
        });
    } catch (err) {
        logger.error("Error creating audit log: ", err);
        throw new ErrorHandler(500, "Failed to create audit log.");
    }
}



module.exports = {
    logAudit,
    getUserNameById
};