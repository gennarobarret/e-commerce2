"use strict";

const multer = require('multer');
const { ErrorHandler, handleErrorResponse } = require("../helpers/responseManagerHelper");

const upload = multer({ dest: 'uploads/' });

const multerErrorHandler = (req, res, next) => {
    const uploadSingle = upload.single('profileImage');
    uploadSingle(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // Errores específicos de Multer
            handleErrorResponse(new ErrorHandler(400, err.message), req, res);
        } else if (err) {
            // Otros errores
            handleErrorResponse(new ErrorHandler(500, err.message), req, res);
        } else {
            next();
        }
    });
};

module.exports = multerErrorHandler;
