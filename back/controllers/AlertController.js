"use strict";

const Alert = require("../models/alertModel");
const User = require("../models/userModel");
const { ErrorHandler, handleErrorResponse, handleSuccessfulResponse } = require("../helpers/responseManagerHelper");
const { logAudit } = require('../helpers/logAuditHelper');
const logger = require('../helpers/logHelper');
const { validateAlert } = require('../helpers/validateHelper');

// Crear una nueva alerta
// Crear una nueva alerta
const createAlert = async (req, res) => {
    try {
        console.log("🚀 ~ createAlert ~ req.io:", req.io);

        // Verificar la disponibilidad de req.io
        if (!req.io) {
            return res.status(500).json({ message: 'Socket.io instance not found on req object' });
        }

        // Obtener datos del cuerpo de la solicitud
        const alertData = req.body;
        const senderId = req.user ? req.user._id : null;

        // Validar campos requeridos
        if (!senderId) {
            return res.status(400).json({ message: 'Sender ID is missing or user is not authenticated' });
        }

        // Validar datos usando Joi
        const { error } = validateAlert({ ...alertData, sender: senderId });
        if (error) {
            return res.status(400).json({ message: error.details.map(detail => detail.message).join(', ') });
        }

        // Crear y guardar la nueva alerta
        const newAlert = new Alert({ ...alertData, sender: senderId });
        await newAlert.save();

        // Emitir el evento de alerta a través de Socket.io
        if (req.io) { // Verificar que req.io está disponible
            req.io.emit('alertCreated', newAlert);
            console.log('Alert emitted:', newAlert); // Log para verificar la emisión de la alerta
        }

        // Responder con éxito
        res.status(201).json({ message: "Alert created successfully", newAlert });
    } catch (error) {
        logger.error(`Error creating alert: ${error.message}`, { error });
        res.status(500).json({ message: 'Error creating alert', error });
    }
};


// Actualizar una alerta por su ID
const updateAlert = async (req, res) => {
    try {
        const alertId = req.params.id;
        const updateData = req.body;

        // Validar datos usando Joi (sin la propiedad sender porque no debería cambiarse)
        const { error } = validateAlert(updateData);
        if (error) {
            return res.status(400).json({ message: error.details.map(detail => detail.message).join(', ') });
        }

        const updatedAlert = await Alert.findByIdAndUpdate(alertId, updateData, { new: true });
        if (!updatedAlert) {
            throw new ErrorHandler(404, "Alert not found");
        }

        // Registrar la auditoría
        await logAudit('UPDATE', req.user._id, alertId, 'Alert', 'info', `Alert ${alertId} updated by user ${req.user._id}`, req.ip, req.originalUrl || '');
        logger.info(`Alert ${alertId} updated by user ${req.user._id}`, { updatedAlert });

        handleSuccessfulResponse("Alert updated successfully", updatedAlert)(req, res);
    } catch (error) {
        logger.error(`Error updating alert: ${error.message}`, { error });
        handleErrorResponse(error, req, res);
    }
};

// Obtener todas las alertas
const getAlerts = async (req, res) => {
    try {
        const { page = 1, limit = 10, type, isSeen, sender } = req.query;
        const filter = {};

        // Aplicar filtros opcionales
        if (type) filter.type = type;
        if (isSeen !== undefined) filter.isSeen = isSeen === 'true';
        if (sender) filter.sender = sender;

        // Recuperar alertas con paginación y filtros
        const alerts = await Alert.find(filter)
            .populate('sender recipients', '_id userName firstName lastName emailAddress')
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))
            .sort({ timestamp: -1 })
            .exec();

        const count = await Alert.countDocuments(filter);

        const sanitizedAlerts = alerts.map(alert => ({
            _id: alert._id,
            type: alert.type,
            message: alert.message,
            sender: alert.sender ? {
                _id: alert.sender._id,
                userName: alert.sender.userName,
                firstName: alert.sender.firstName,
                lastName: alert.sender.lastName,
                emailAddress: alert.sender.emailAddress
            } : null,
            recipients: alert.recipients.map(recipient => ({
                _id: recipient._id,
                userName: recipient.userName,
                firstName: recipient.firstName,
                lastName: recipient.lastName,
                emailAddress: recipient.emailAddress
            })),
            isSeen: alert.isSeen,
            seenBy: alert.seenBy,
            timestamp: alert.timestamp,
            createdAt: alert.createdAt,
            updatedAt: alert.updatedAt,
            __v: alert.__v
        }));

        handleSuccessfulResponse("Alerts retrieved successfully", {
            alerts: sanitizedAlerts,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalAlerts: count
        })(req, res);
    } catch (error) {
        handleErrorResponse(error, req, res);
    }
};

// Obtener una alerta por su ID
const getAlertById = async (req, res) => {
    try {
        const alertId = req.params.id;
        const alert = await Alert.findById(alertId).populate('sender recipients');
        if (!alert) {
            throw new ErrorHandler(404, "Alert not found");
        }
        handleSuccessfulResponse("Alert found", alert)(req, res);
    } catch (error) {
        handleErrorResponse(error, req, res);
    }
};

// Marcar una alerta como vista
const markAsSeen = async (req, res) => {
    // console.log("🚀 ~ markAsSeen ~ req:", req)
    try {
        const alertId = req.params.id;
        const userId = req.user ? req.user.sub : null;
        console.log("🚀 ~ markAsSeen ~ userId:", userId)
        if (!userId) {
            return res.status(400).json({ message: 'User ID is missing or user is not authenticated' });
        }

        const alert = await Alert.findById(alertId);
        if (!alert) {
            throw new ErrorHandler(404, "Alert not found");
        }

        console.log('Marking as seen:', { alertId, userId }); // Mensaje de depuración

        await alert.markAsSeen(userId);

        // Registrar la auditoría (comentado para depuración)
        // await logAudit('MARK_AS_SEEN', userId, alertId, 'Alert', 'info', `Alert ${alertId} marked as seen by user ${userId}`, req.ip, req.originalUrl || '');

        handleSuccessfulResponse("Alert marked as seen", alert)(req, res);
    } catch (error) {
        console.error('Error in markAsSeen:', error); // Mensaje de depuración
        handleErrorResponse(error, req, res);
    }
};


// Eliminar una alerta por su ID
const deleteAlert = async (req, res) => {
    try {
        const alertId = req.params.id;
        const alert = await Alert.findByIdAndDelete(alertId);
        if (!alert) {
            throw new ErrorHandler(404, "Alert not found");
        }

        // Registrar la auditoría
        await logAudit('DELETE', req.user._id, alertId, 'Alert', 'info', `Alert ${alertId} deleted by user ${req.user._id}`, req.ip, req.originalUrl || '');

        handleSuccessfulResponse("Alert deleted successfully", { id: alertId })(req, res);
    } catch (error) {
        handleErrorResponse(error, req, res);
    }
};

module.exports = {
    createAlert,
    getAlerts,
    getAlertById,
    updateAlert,
    markAsSeen,
    deleteAlert
};
