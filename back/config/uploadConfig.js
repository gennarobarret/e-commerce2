const multer = require('multer');
const path = require('path');
const { ErrorHandler, handleErrorResponse } = require("../helpers/responseManagerHelper");

// Función para configurar almacenamiento dinámico según el tipo de entidad
const getStorageConfig = (entityType) => {
    return multer.diskStorage({
        destination: function (req, file, cb) {
            const basePath = `uploads/${entityType}`;
            cb(null, basePath);
        },
        filename: function (req, file, cb) {
            const timestamp = Date.now();
            const extension = path.extname(file.originalname);

            const identifier = req.params.identifier;

            if (!identifier) {
                return cb(new ErrorHandler(400, 'Identifier is required to generate filename.'));
            }

            const newFileName = `${identifier}-${timestamp}${extension}`;
            cb(null, newFileName);
        }
    });
};


const getUploadConfig = (entityType) => {
    return multer({
        storage: getStorageConfig(entityType),
        limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
        fileFilter: function (req, file, cb) {
            const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/jpg', 'image/gif'];
            if (!allowedTypes.includes(file.mimetype)) {
                const error = new ErrorHandler(400, 'Invalid file type. Only JPEG, PNG, WEBP, JPG, GIF are allowed.');
                return cb(error);
            }
            cb(null, true);
        }
    });
};

// Middleware para manejar errores de Multer
const multerErrorHandler = (entityType) => {
    return (req, res, next) => {
        const uploadSingle = getUploadConfig(entityType).single('image');
        uploadSingle(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                // Error de Multer
                const error = new ErrorHandler(400, err.message);
                return handleErrorResponse(error, req, res);
            } else if (err) {
                // Otro tipo de error
                const error = new ErrorHandler(500, err.message);
                return handleErrorResponse(error, req, res);
            }
            next();
        });
    };
};

module.exports = {
    multerErrorHandler
};
