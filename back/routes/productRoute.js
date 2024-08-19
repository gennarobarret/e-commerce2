const express = require('express');
const api = express.Router();
const productController = require('../controllers/ProductController');
const imageController = require('../controllers/ImageController');
const uploadConfig = require('../config/uploadConfig');
const auth = require('../middlewares/authenticate');
const rbac = require('../middlewares/rbacMiddleware');

api.post('/createProduct', [auth.auth, rbac('create', 'product')], productController.createProduct);
api.get('/listAllProducts', [auth.auth, rbac('read', 'product')], productController.listAllProducts);
api.get('/getProductById/:id', [auth.auth, rbac('read', 'product')], productController.getProductById);
api.put('/updateProduct/:id', [auth.auth, rbac('update', 'product')], productController.updateProduct);
api.delete('/deleteProduct/:id', [auth.auth, rbac('delete', 'product')], productController.deleteProduct);
api.post('/uploadProductImage/:identifier',
    [auth.auth, rbac('update', 'product'), uploadConfig.multerErrorHandler('products')],
    async (req, res, next) => {
        try {
            req.params.entityType = 'products';
            req.params.entityId = req.params.identifier;
            await imageController.uploadImage(req, res, next);
            const imageUrl = req.file.filename;
            await productController.updateProductImageUrl(req.params.identifier, imageUrl);
            res.status(200).json({ message: 'Product image updated successfully' });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = api;
