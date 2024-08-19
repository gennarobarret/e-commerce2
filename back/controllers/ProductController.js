"use strict";
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Subcategory = require('../models/subcategoryModel');
const mongoose = require('mongoose');
const { ErrorHandler, handleErrorResponse, handleSuccessfulResponse } = require('../helpers/responseManagerHelper');
const { logAudit } = require('../helpers/logAuditHelper');
const logger = require('../helpers/logHelper');

const updateProductImageUrl = async (productId, imageUrl) => {
    try {
        // Actualizar el campo `imageUrl` en la base de datos para el usuario dado
        await User.findByIdAndUpdate(productId, { imageUrl });

    } catch (error) {
        console.error('Error updating product image:', error);
        throw new ErrorHandler(500, "Failed to update product image.");
    }

}

// Crear un nuevo producto
const createProduct = async (req, res) => {
    try {
        const { name, description, price, category, subcategory, stock, manufacturer, gallery, discount, colors, sizes } = req.body;

        // Verifica si la categoría existe
        if (category && !mongoose.Types.ObjectId.isValid(category)) {
            throw new ErrorHandler(400, "Invalid Category ID", req.originalUrl, req.method);
        }

        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            throw new ErrorHandler(404, "Category not found", req.originalUrl, req.method);
        }

        // Verifica si la subcategoría existe
        if (subcategory && !mongoose.Types.ObjectId.isValid(subcategory)) {
            throw new ErrorHandler(400, "Invalid Subcategory ID", req.originalUrl, req.method);
        }

        const subcategoryExists = await Subcategory.findById(subcategory);
        if (subcategory && !subcategoryExists) {
            throw new ErrorHandler(404, "Subcategory not found", req.originalUrl, req.method);
        }

        const newProduct = new Product({ name, description, price, category, subcategory, stock, manufacturer, gallery, discount, colors, sizes });
        await newProduct.save();

        handleSuccessfulResponse("Product created successfully", { productId: newProduct._id })(req, res);

        await logAudit('CREATE_PRODUCT', req.user ? req.user._id : 'system', newProduct._id, 'Product', 'Medium', 'Product created', req.ip, req.originalUrl);
    } catch (error) {
        logger.error('createProduct error:', error);
        handleErrorResponse(error, req, res);
    }
};

// Listar todos los productos
const listAllProducts = async (req, res) => {
    try {
        const products = await Product.find()
            .populate('category', 'name')
            .populate('subcategory', 'name');

        handleSuccessfulResponse("Products listed successfully", products)(req, res);

        await logAudit('LIST_PRODUCTS', req.user ? req.user._id : 'system', null, 'Product', 'Low', 'Listed all products', req.ip, req.originalUrl);
    } catch (error) {
        logger.error('listAllProducts error:', error);
        handleErrorResponse(error, req, res);
    }
};

// Obtener un producto por ID
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ErrorHandler(400, "Invalid Product ID", req.originalUrl, req.method);
        }

        const product = await Product.findById(id)
            .populate('category', 'name')
            .populate('subcategory', 'name');

        if (!product) {
            throw new ErrorHandler(404, "Product not found", req.originalUrl, req.method);
        }

        handleSuccessfulResponse("Product retrieved successfully", product)(req, res);

        await logAudit('GET_PRODUCT', req.user ? req.user._id : 'system', product._id, 'Product', 'Low', 'Retrieved product', req.ip, req.originalUrl);
    } catch (error) {
        logger.error('getProductById error:', error);
        handleErrorResponse(error, req, res);
    }
};

// Actualizar un producto
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { category, subcategory, ...data } = req.body;

        // Verifica si la categoría existe antes de actualizar
        if (category && !mongoose.Types.ObjectId.isValid(category)) {
            throw new ErrorHandler(400, "Invalid Category ID", req.originalUrl, req.method);
        }

        if (category) {
            const categoryExists = await Category.findById(category);
            if (!categoryExists) {
                throw new ErrorHandler(404, "Category not found", req.originalUrl, req.method);
            }
        }

        // Verifica si la subcategoría existe antes de actualizar
        if (subcategory && !mongoose.Types.ObjectId.isValid(subcategory)) {
            throw new ErrorHandler(400, "Invalid Subcategory ID", req.originalUrl, req.method);
        }

        if (subcategory) {
            const subcategoryExists = await Subcategory.findById(subcategory);
            if (!subcategoryExists) {
                throw new ErrorHandler(404, "Subcategory not found", req.originalUrl, req.method);
            }
        }

        const updatedProduct = await Product.findByIdAndUpdate(id, { ...data, category, subcategory }, { new: true });
        if (!updatedProduct) {
            throw new ErrorHandler(404, "Product not found", req.originalUrl, req.method);
        }

        handleSuccessfulResponse("Product updated successfully", updatedProduct)(req, res);

        await logAudit('UPDATE_PRODUCT', req.user ? req.user._id : 'system', updatedProduct._id, 'Product', 'Medium', 'Updated product', req.ip, req.originalUrl);
    } catch (error) {
        logger.error('updateProduct error:', error);
        handleErrorResponse(error, req, res);
    }
};

// Eliminar un producto
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findByIdAndDelete(id);
        if (!product) {
            throw new ErrorHandler(404, "Product not found", req.originalUrl, req.method);
        }

        handleSuccessfulResponse("Product deleted successfully", { id })(req, res);

        await logAudit('DELETE_PRODUCT', req.user ? req.user._id : 'system', id, 'Product', 'High', 'Deleted product', req.ip, req.originalUrl);
    } catch (error) {
        logger.error('deleteProduct error:', error);
        handleErrorResponse(error, req, res);
    }
};




module.exports = {
    createProduct,
    listAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    updateProductImageUrl
};
