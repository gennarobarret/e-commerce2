const express = require('express');
const api = express.Router();
const imageController = require('../controllers/ImageController');
const uploadConfig = require('../config/uploadConfig');
const auth = require('../middlewares/authenticate');
const rbac = require('../middlewares/rbacMiddleware');

// Subir imágenes para cualquier entidad (usuarios, productos, categorías, etc.)
api.post('/upload/:entityType/:entityId',
    (req, res, next) => {
        const entityType = req.params.entityType.toLowerCase();

        // Mapear entityType a los recursos conocidos
        const resourceMap = {
            'users': 'user',
            'products': 'product',
            'categories': 'category',
            'subcategories': 'subcategory',
            // Agrega más mapeos si tienes más tipos de entidades
        };

        req.resource = resourceMap[entityType];

        if (!req.resource) {
            return res.status(400).json({
                status: 'error',
                statusCode: 400,
                message: 'Invalid entity type',
                details: `Entity type '${req.params.entityType}' is not recognized.`
            });
        }

        // Aquí asignamos el entityId como identifier
        req.params.identifier = req.params.entityId;

        next();
    },
    [auth.auth, (req, res, next) => rbac('update', req.resource)(req, res, next)],
    (req, res, next) => uploadConfig.multerErrorHandler(req.params.entityType)(req, res, next),
    imageController.uploadImage
);


// Obtener imágenes para cualquier entidad
api.get('/:entityType/:fileName',
    (req, res, next) => {
        const entityType = req.params.entityType.toLowerCase();

        // Mapear entityType a los recursos conocidos
        const resourceMap = {
            'users': 'user',
            'products': 'product',
            'categories': 'category',
            'subcategories': 'subcategory',
            // Agrega más mapeos si tienes más tipos de entidades
        };

        req.resource = resourceMap[entityType];

        if (!req.resource) {
            return res.status(400).json({
                status: 'error',
                statusCode: 400,
                message: 'Invalid entity type',
                details: `Entity type '${req.params.entityType}' is not recognized.`
            });
        }

        next();
    },
    [auth.auth, (req, res, next) => rbac('read', req.resource)(req, res, next)],
    imageController.getImage
);

// Eliminar imágenes para cualquier entidad
api.delete('/:entityType/:fileName',
    (req, res, next) => {
        const entityType = req.params.entityType.toLowerCase();

        // Mapear entityType a los recursos conocidos
        const resourceMap = {
            'users': 'user',
            'products': 'product',
            'categories': 'category',
            'subcategories': 'subcategory',
            // Agrega más mapeos si tienes más tipos de entidades
        };

        req.resource = resourceMap[entityType];

        if (!req.resource) {
            return res.status(400).json({
                status: 'error',
                statusCode: 400,
                message: 'Invalid entity type',
                details: `Entity type '${req.params.entityType}' is not recognized.`
            });
        }

        next();
    },
    [auth.auth, (req, res, next) => rbac('delete', req.resource)(req, res, next)],
    imageController.deleteImage
);

module.exports = api;
