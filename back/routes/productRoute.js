const express = require('express');
const mongoose = require('mongoose');
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

const validateProductExists = async (req, res, next) => {
    const productId = req.params.identifier;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: 'Invalid product ID format.' });
    }
    try {
        const productExists = await Product.findById(productId);
        if (!productExists) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        next();
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
};

api.post('/uploadProductImage/:identifier',
    [auth.auth, rbac('update', 'product'), validateProductExists],
    uploadConfig.multerErrorHandler('products'),
    async (req, res, next) => {
        try {
            const imageUrl = req.file.filename;
            await Product.findByIdAndUpdate(req.params.identifier, { imageUrl });
            res.status(200).json({ message: 'Product image updated successfully', fileName: imageUrl });
        } catch (error) {
            next(error);
        }
    }
);

api.get('/getProductImage/:identifier',
    [auth.auth, rbac('read', 'product')],
    async (req, res) => {
        try {
            const product = await Product.findById(req.params.identifier);
            if (!product || !product.imageUrl) {
                return res.status(404).json({ message: 'Product image not found.' });
            }
            res.status(200).json({ imageUrl: product.imageUrl });
        } catch (error) {
            res.status(500).json({ message: 'Internal server error.', error: error.message });
        }
    }
);

api.delete('/deleteProductImage/:identifier',
    [auth.auth, rbac('delete', 'product'), validateProductExists],
    async (req, res) => {
        try {
            await Product.findByIdAndUpdate(req.params.identifier, { imageUrl: null });
            res.status(200).json({ message: 'Product image deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Internal server error.', error: error.message });
        }
    }
);

module.exports = api;
