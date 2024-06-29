'use strict';

// External modules (npm)
const mongoose = require('mongoose');

// Models (Internal modules)
const Notification = require('../models/notificationModel');

// Response and Error Handling (Internal modules)
const { ErrorHandler, handleErrorResponse, handleSuccessfulResponse } = require('../helpers/responseManagerHelper');

// Logging and Auditing (Internal modules)
const logger = require('../helpers/logHelper');
const { logAudit } = require('../helpers/logAuditHelper');

// Notification Service (Internal modules)
const notificationService = require('../services/notificationService');

function getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',').shift() || req.socket.remoteAddress;
}

// Mark a notification as viewed
const markAsViewed = async (req, res) => {
    const { id } = req.params; // Notification ID
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ErrorHandler(400, "Invalid notification ID", req.originalUrl, req.method);
        }

        const notification = await Notification.findByIdAndUpdate(id, { isViewed: true }, { new: true });
        if (!notification) {
            throw new ErrorHandler(404, 'Notification not found', req.originalUrl, req.method);
        }

        // Log the action in the audit log
        const logMessage = `Notification marked as viewed: ID=${id}`;
        await logAudit(
            'MARK_NOTIFICATION_VIEWED',
            req.user ? req.user.userName : 'unknown',
            id,
            'Notification',
            'Low',
            logMessage,
            getClientIp(req),
            req.originalUrl || ''
        );

        handleSuccessfulResponse("Notification marked as viewed", { notification })(req, res);
    } catch (error) {
        logger.error('markAsViewed error:', error);
        handleErrorResponse(error, req, res);
    }
};

// Delete a specific notification
const deleteNotification = async (req, res) => {
    const { id } = req.params; // Notification ID
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ErrorHandler(400, "Invalid notification ID", req.originalUrl, req.method);
        }

        const notification = await Notification.findByIdAndDelete(id);
        if (!notification) {
            throw new ErrorHandler(404, 'Notification not found', req.originalUrl, req.method);
        }

        // Log the action in the audit log
        const logMessage = `Notification deleted: ID=${id}`;
        await logAudit(
            'DELETE_NOTIFICATION',
            req.user ? req.user.userName : 'unknown',
            id,
            'Notification',
            'Medium',
            logMessage,
            getClientIp(req),
            req.originalUrl || ''
        );

        handleSuccessfulResponse("Notification deleted successfully", {})(req, res);
    } catch (error) {
        logger.error('deleteNotification error:', error);
        handleErrorResponse(error, req, res);
    }
};

// Delete all viewed notifications
const deleteAllViewedNotifications = async (req, res) => {
    try {
        const result = await Notification.deleteMany({ isViewed: true });

        // Log the action in the audit log
        const logMessage = `All viewed notifications deleted: Count=${result.deletedCount}`;
        await logAudit(
            'DELETE_ALL_VIEWED_NOTIFICATIONS',
            req.user ? req.user.userName : 'unknown',
            null,
            'Notification',
            'High',
            logMessage,
            getClientIp(req),
            req.originalUrl || ''
        );

        handleSuccessfulResponse("All viewed notifications deleted successfully", { deletedCount: result.deletedCount })(req, res);
    } catch (error) {
        logger.error('deleteAllViewedNotifications error:', error);
        handleErrorResponse(error, req, res);
    }
};

// Get all notifications for a user
const getNotifications = async (req, res) => {
    const userId = req.user.sub; // Assuming `sub` is the user ID in your JWT
    try {
        const notifications = await Notification.find({ userId }).sort({ date: -1 });
        handleSuccessfulResponse("Notifications retrieved successfully", { notifications })(req, res);
    } catch (error) {
        logger.error('getNotifications error:', error);
        handleErrorResponse(error, req, res);
    }
};

// Create a test notification
const createTestNotification = async (req, res) => {
    try {
        const { userId, icon, message, type } = req.body;

        // Validación básica
        if (!userId || !icon || !message || !type) {
            return handleErrorResponse(new ErrorHandler(400, 'All fields are required.'), req, res);
        }

        const notification = await notificationService.createNotification({
            userId,
            icon,
            message,
            type
        });

        handleSuccessfulResponse('Notification created successfully.', { notification })(req, res);
    } catch (error) {
        console.error('createTestNotification error:', error);
        handleErrorResponse(new ErrorHandler(500, 'An error occurred while creating the notification.'), req, res);
    }
};

module.exports = {
    markAsViewed,
    deleteNotification,
    deleteAllViewedNotifications,
    getNotifications,
    createTestNotification
};
