"use strict";

const Message = require("../models/messageModel");
const User = require("../models/userModel");
const { ErrorHandler, handleErrorResponse, handleSuccessfulResponse } = require("../helpers/responseManagerHelper");
const { logAudit } = require('../helpers/logAuditHelper');
const mongoose = require('mongoose');

// Crear un nuevo mensaje
const createMessage = async (req, res) => {
    try {
        const { content, recipients, importance } = req.body;
        const senderId = req.user._id;

        // Crear y guardar el nuevo mensaje
        const newMessage = new Message({ content, sender: senderId, recipients, importance });
        await newMessage.save();

        // Registrar la auditoría
        await logAudit('CREATE', senderId, newMessage._id, 'Message', 'info', `Message created by user ${senderId}`, req.ip);

        handleSuccessfulResponse("Message created successfully", newMessage)(req, res);
    } catch (error) {
        handleErrorResponse(error, req, res);
    }
};

// Obtener todos los mensajes
const getMessages = async (req, res) => {
    try {
        const messages = await Message.find().populate('sender recipients');
        handleSuccessfulResponse("Messages retrieved successfully", messages)(req, res);
    } catch (error) {
        handleErrorResponse(error, req, res);
    }
};

// Obtener un mensaje por su ID
const getMessageById = async (req, res) => {
    try {
        const messageId = req.params.id;
        const message = await Message.findById(messageId).populate('sender recipients');
        if (!message) {
            throw new ErrorHandler(404, "Message not found");
        }
        handleSuccessfulResponse("Message found", message)(req, res);
    } catch (error) {
        handleErrorResponse(error, req, res);
    }
};

// Actualizar un mensaje por su ID
const updateMessage = async (req, res) => {
    try {
        const messageId = req.params.id;
        const updateData = req.body;

        const updatedMessage = await Message.findByIdAndUpdate(messageId, updateData, { new: true });
        if (!updatedMessage) {
            throw new ErrorHandler(404, "Message not found");
        }

        // Registrar la auditoría
        await logAudit('UPDATE', req.user._id, messageId, 'Message', 'info', `Message ${messageId} updated by user ${req.user._id}`, req.ip);

        handleSuccessfulResponse("Message updated successfully", updatedMessage)(req, res);
    } catch (error) {
        handleErrorResponse(error, req, res);
    }
};

// Marcar un mensaje como leído
const markAsRead = async (req, res) => {
    try {
        const messageId = req.params.id;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            throw new ErrorHandler(404, "Message not found");
        }

        message.markAsRead(userId);

        // Registrar la auditoría
        await logAudit('MARK_AS_READ', userId, messageId, 'Message', 'info', `Message ${messageId} marked as read by user ${userId}`, req.ip);

        handleSuccessfulResponse("Message marked as read", message)(req, res);
    } catch (error) {
        handleErrorResponse(error, req, res);
    }
};

// Eliminar un mensaje por su ID
const deleteMessage = async (req, res) => {
    try {
        const messageId = req.params.id;
        const message = await Message.findByIdAndDelete(messageId);
        if (!message) {
            throw new ErrorHandler(404, "Message not found");
        }

        // Registrar la auditoría
        await logAudit('DELETE', req.user._id, messageId, 'Message', 'info', `Message ${messageId} deleted by user ${req.user._id}`, req.ip);

        handleSuccessfulResponse("Message deleted successfully", { id: messageId })(req, res);
    } catch (error) {
        handleErrorResponse(error, req, res);
    }
};

module.exports = {
    createMessage,
    getMessages,
    getMessageById,
    updateMessage,
    markAsRead,
    deleteMessage
};
