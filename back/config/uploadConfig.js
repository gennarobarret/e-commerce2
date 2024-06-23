// config/uploadConfig.js
const multer = require('multer');
const path = require('path');
const { ErrorHandler, handleErrorResponse } = require("../helpers/responseManagerHelper");

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/users/staffs');
    },
    filename: function (req, file, cb) {
        const timestamp = Date.now();
        const extension = path.extname(file.originalname);
        const newFileName = `${req.params.userName}-${timestamp}${extension}`;
        cb(null, newFileName);
    }
});

// Configuración de Multer
const upload = multer({
    storage: storage,
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

// Middleware para manejar errores de Multer
const multerErrorHandler = (req, res, next) => {
    const uploadSingle = upload.single('profileImage');
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

module.exports = {
    multerErrorHandler
};
