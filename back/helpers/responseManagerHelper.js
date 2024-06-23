"use strict";

const logger = require('./logHelper');

// Función para sanitizar el path
const sanitizePath = (path) => {
    if (!path) {
        return 'undefined_path';
    }
    return path.startsWith('/api/') ? path.slice(5) : path;
};

class ErrorHandler extends Error {
    constructor(statusCode, message, path, method, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.path = sanitizePath(path); // Utiliza la función de sanitización aquí
        this.method = method;
        this.details = details || 'No additional details provided.';
    }

    logError(req) {
        logger.error(`${this.path} error: ${this.message}`, {
            path: this.path,
            method: this.method,
            status: this.statusCode,
            stack: this.details,
            timestamp: new Date().toISOString()
        });
    }

    handleResponse(res) {
        res.status(this.statusCode).json({
            status: "error",
            statusCode: this.statusCode,
            message: this.message,
            details: this.details || "No detailed information is available."
        });
    }
}

const handleErrorResponse = (error, req, res) => {
    const path = req.originalUrl || 'undefined_path';
    const method = req.method || 'undefined_method';

    if (!(error instanceof ErrorHandler)) {
        error = new ErrorHandler(500, error.message || "Server error", path, method, 'Contact support.');
    }
    error.logError(req);
    error.handleResponse(res);
};

const handleSuccessfulResponse = (message, data) => {
    return (req, res) => {
        const path = req.originalUrl || 'undefined_path';
        const sanitizedPath = sanitizePath(path); // Sanitiza el path aquí
        const method = req.method || 'undefined_method';

        logger.info(`API Success: ${sanitizedPath}`, { // Utiliza el path sanitizado aquí
            path: sanitizedPath,
            method: method,
            status: 200,
            timestamp: new Date().toISOString()
        });
        res.status(200).json({
            status: "success",
            message: message,
            data: data
        });
    };
};

module.exports = {
    ErrorHandler,
    handleErrorResponse,
    handleSuccessfulResponse
};
