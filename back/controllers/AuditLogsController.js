"use strict";

const AuditLog = require("../models/auditLogModel");
const { ErrorHandler, handleErrorResponse, handleSuccessfulResponse } = require("../helpers/responseManagerHelper");

const getAuditLogsByTargetDoc = async (req, res) => {
    try {
        const { targetDoc } = req.params;
        const auditLogs = await AuditLog.find({ targetDoc })
            .populate('by', 'userName')
            .sort({ createdAt: -1 });
        if (!auditLogs.length) {
            throw new ErrorHandler(404, "No audit logs found for the provided document ID.");
        }
        handleSuccessfulResponse("Audit logs retrieved successfully", auditLogs)(req, res);
    } catch (error) {
        console.error("Failed to retrieve audit logs:", error);
        handleErrorResponse(error, req, res);
    }
};

const checkAuditLogs = async () => {
    const recentLogs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(50);
    recentLogs.forEach(log => {
        handleAlerts(log);
    });
};

const getAuditLogById = async (req, res) => {
    try {
        const { id } = req.params;
        const auditLog = await AuditLog.findById(id)
            .populate('by', 'userName');

        if (!auditLog) {
            throw new ErrorHandler(404, "Audit log not found.");
        }
        handleSuccessfulResponse("Audit log retrieved successfully", auditLog)(req, res);
    } catch (error) {
        handleErrorResponse(error, req, res);
    }
};

const listAllAuditLogs = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const auditLogs = await AuditLog.find()
            .populate('by', 'userName')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        if (!auditLogs.length) {
            throw new ErrorHandler(404, "No audit logs found.");
        }

        handleSuccessfulResponse("Audit logs retrieved successfully", auditLogs)(req, res);
    } catch (error) {
        console.error("Failed to retrieve audit logs:", error);
        handleErrorResponse(error, req, res);
    }
};

const deleteAuditLog = async (req, res) => {
    try {
        const { id } = req.params;
        const auditLog = await AuditLog.findByIdAndRemove(id);
        if (!auditLog) {
            throw new ErrorHandler(404, "Audit log not found.");
        }
        handleSuccessfulResponse("Audit log deleted successfully", {})(req, res);
    } catch (error) {
        handleErrorResponse(error, req, res);
    }
};

module.exports = {
    getAuditLogsByTargetDoc,
    getAuditLogById,
    listAllAuditLogs,
    checkAuditLogs,
    deleteAuditLog
};
