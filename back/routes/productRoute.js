const express = require('express');
const api = express.Router();
const productController = require('../controllers/ProductController');
const uploadConfig = require('../config/uploadConfig');
const auth = require('../middlewares/authenticate');
const rbac = require('../middlewares/rbacMiddleware');
const Product = require('../models/productModel');

api.post('/createProduct', [auth.auth, rbac('create', 'product')], productController.createProduct);
api.get('/listAllProducts', [auth.auth, rbac('read', 'product')], productController.listAllProducts);
api.get('/getProductById/:id', [auth.auth, rbac('read', 'product')], productController.getProductById);
api.put('/updateProduct/:id', [auth.auth, rbac('update', 'product')], productController.updateProduct);
api.delete('/deleteProduct/:id', [auth.auth, rbac('delete', 'product')], productController.deleteProduct);
api.post('/uploadProductImage/:identifier/:type',
    (req, res, next) => {
        const { type } = req.params;
        if (type === 'cover') {
            uploadConfig.removePreviousImage('products', Product)(req, res, (err) => {
                if (err) return next(err);
                return uploadConfig.multerErrorHandler('products')(req, res, next);
            });
        } else if (type === 'gallery') {
            // Eliminar todas las imágenes de la galería antes de subir las nuevas
            uploadConfig.removeAllGalleryImages('products', Product)(req, res, (err) => {
                if (err) return next(err);
                return uploadConfig.multerMultipleErrorHandler('products', 10)(req, res, next);
            });
        } else {
            next(new ErrorHandler(400, 'Invalid upload type specified.'));
        }
    },
    productController.uploadProductImage
);
api.get('/getProductImage/:identifier/:type/:imageId?',
    [auth.auth, rbac('read', 'product')],
    productController.getProductImage
);
api.delete('/deleteProductImage/:identifier',
    [auth.auth, rbac('delete', 'product')],
    productController.deleteProductImage
);

module.exports = api;
