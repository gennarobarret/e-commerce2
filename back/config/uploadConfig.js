const fs = require('fs');
const path = require('path');
const multer = require('multer');
const mongoose = require('mongoose');
const { ErrorHandler, handleErrorResponse } = require("../helpers/responseManagerHelper");

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

const removePreviousImage = (entityType, model) => {
    return async (req, res, next) => {
        const directoryPath = path.join(__dirname, '..', 'uploads', entityType);
        const identifier = req.params.identifier;

        if (!identifier) {
            return next(new ErrorHandler(400, 'Identifier is required to remove previous image.'));
        }

        if (!mongoose.Types.ObjectId.isValid(identifier)) {
            return next(new ErrorHandler(400, 'Invalid ID format.'));
        }

        try {
            const documentExists = await model.findById(identifier);
            if (!documentExists) {
                return next(new ErrorHandler(404, `${model.modelName} not found.`));
            }
        } catch (error) {
            return next(new ErrorHandler(500, 'Internal server error.'));
        }

        fs.readdir(directoryPath, (err, files) => {
            if (err) {
                return next(new ErrorHandler(500, 'Failed to read directory for previous images.'));
            }

            const matchingFiles = files.filter(file => file.startsWith(identifier));

            matchingFiles.forEach(file => {
                const filePath = path.join(directoryPath, file);
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error(`Failed to delete file: ${filePath}`, err);
                    } else {
                        console.log(`Successfully deleted previous file: ${filePath}`);
                    }
                });
            });

            next();
        });
    };
};

const removeAllGalleryImages = (entityType, model) => {
    return async (req, res, next) => {
        const directoryPath = path.join(__dirname, '..', 'uploads', entityType);
        const identifier = req.params.identifier;

        if (!identifier) {
            return next(new ErrorHandler(400, 'Identifier is required to remove gallery images.'));
        }

        if (!mongoose.Types.ObjectId.isValid(identifier)) {
            return next(new ErrorHandler(400, 'Invalid ID format.'));
        }

        try {
            const document = await model.findById(identifier);
            if (!document) {
                return next(new ErrorHandler(404, `${model.modelName} not found.`));
            }

            const galleryImages = document.gallery;

            if (!galleryImages || galleryImages.length === 0) {
                return next(); // No hay imágenes en la galería, sigue adelante
            }

            // Eliminar todos los archivos de la galería del sistema de archivos
            galleryImages.forEach(image => {
                const filePath = path.join(directoryPath, image.imageUrl);
                fs.unlink(filePath, err => {
                    if (err) {
                        console.error(`Failed to delete file: ${filePath}`, err);
                    } else {
                        console.log(`Successfully deleted file: ${filePath}`);
                    }
                });
            });

            // Limpiar la galería en la base de datos
            document.gallery = [];
            await document.save();

            next();
        } catch (error) {
            return next(new ErrorHandler(500, 'Internal server error.'));
        }
    };
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

const multerErrorHandler = (entityType) => {
    return (req, res, next) => {
        const uploadSingle = getUploadConfig(entityType).single('image');
        uploadSingle(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                const error = new ErrorHandler(400, err.message);
                return handleErrorResponse(error, req, res);
            } else if (err) {
                const error = new ErrorHandler(500, err.message);
                return handleErrorResponse(error, req, res);
            }
            next();
        });
    };
};

const multerMultipleErrorHandler = (entityType, maxFiles = 10) => {
    return (req, res, next) => {
        const uploadMultiple = getUploadConfig(entityType).array('images', maxFiles);
        uploadMultiple(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                const error = new ErrorHandler(400, err.message);
                return handleErrorResponse(error, req, res);
            } else if (err) {
                const error = new ErrorHandler(500, err.message);
                return handleErrorResponse(error, req, res);
            }
            next();
        });
    };
};

module.exports = {
    removePreviousImage,
    removeAllGalleryImages, // Exporta la nueva función para eliminar imágenes específicas
    multerErrorHandler,
    multerMultipleErrorHandler
};
