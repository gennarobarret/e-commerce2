"use strict";

const Alert = require('../models/alertModel');
const { validateAlert } = require('../helpers/validateHelper');

/**
 * Crea una alerta para el propio usuario y la guarda en la base de datos.
 * @param {String} userId - El ID del usuario que genera y recibe la alerta.
 * @param {String} type - El tipo de alerta (info, warning, danger, success).
 * @param {String} message - El mensaje de la alerta.
 * @param {Object} io - Instancia de Socket.io para emitir eventos de alerta (opcional).
 * @returns {Promise<Object>} - La alerta creada.
 */
const createSelfAlert = async (userId, type, message, io = null) => {
    try {
        if (io) {
            io.emit('alertCreated', alert);
            console.log('Alert emitted:', alert); // Verificar que la alerta se emite
        }

        // Validar datos usando Joi
        const { error } = validateAlert({ type, message, sender: userId, recipients: [userId] });
        if (error) {
            throw new Error(`Validation error: ${error.details.map(detail => detail.message).join(', ')}`);
        }

        const alert = new Alert({
            type,
            message,
            sender: userId,
            recipients: [userId],
            isSeen: false,
            seenBy: [],
            timestamp: new Date()
        });

        // Guardar la alerta en la base de datos
        await alert.save();

        // Emitir el evento de alerta a través de Socket.io, si está disponible
        if (io) {
            io.emit('alertCreated', alert);
        }

        // console.log('Self alert created:', alert);
        return alert;
    } catch (error) {
        console.error(`Error creating self alert: ${error.message}`, { error });
        throw error; // Re-lanzar el error para que el llamador pueda manejarlo
    }
};

module.exports = {
    createSelfAlert
};
