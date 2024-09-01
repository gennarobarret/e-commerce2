"use strict";

// Native Node.js modules
const fs = require('fs').promises;
const path = require("path");

// External modules (npm)
const mongoose = require('mongoose');

// Models (Internal modules)
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Subcategory = require('../models/subcategoryModel');

// Response and Error Handling (Internal modules)
const { ErrorHandler, handleErrorResponse, handleSuccessfulResponse } = require('../helpers/responseManagerHelper');
const { logAudit } = require('../helpers/logAuditHelper');
const logger = require('../helpers/logHelper');

// Services
const uploadConfig = require('../config/uploadConfig');
const notificationService = require('../services/notificationService');

const createProduct = async (req, res) => {
    try {
        const { name, description, price, category, subcategory, stock, manufacturer, gallery, discount, colors, sizes, productType } = req.body;

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

        const newProduct = new Product({
            name,
            description,
            price,
            category,
            subcategory,
            stock,
            manufacturer,
            gallery,
            discount,
            colors,
            sizes: productType === 'physical' ? sizes : undefined, // Solo asignar tamaños si es un producto físico
            productType
        });

        await newProduct.save();

        handleSuccessfulResponse("Product created successfully", { productId: newProduct._id })(req, res);

        await logAudit('CREATE_PRODUCT', req.user ? req.user._id : 'system', newProduct._id, 'Product', 'Medium', 'Product created', req.ip, req.originalUrl);
    } catch (error) {
        logger.error('createProduct error:', error);
        handleErrorResponse(error, req, res);
    }
};

const listAllProducts = async (req, res) => {
    try {
        // Busca todos los productos y popula las referencias de categoría y subcategoría con sus nombres
        const products = await Product.find()
            .populate('category', 'title') // Esto trae solo el campo 'name' de la categoría
            .populate('subcategory', 'title'); // Esto trae solo el campo 'name' de la subcategoría

        // Responde con éxito incluyendo la lista de productos y sus categorías/subcategorías populadas
        handleSuccessfulResponse("Products listed successfully", products)(req, res);

        // Registra la auditoría de la operación
        await logAudit('LIST_PRODUCTS', req.user ? req.user._id : 'system', null, 'Product', 'Low', 'Listed all products', req.ip, req.originalUrl);
    } catch (error) {
        // Loguea y maneja cualquier error que ocurra
        logger.error('listAllProducts error:', error);
        handleErrorResponse(error, req, res);
    }
};

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

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { category, subcategory, productType, sizes, ...data } = req.body;

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

        // Condicionalmente incluir tamaños si el producto es físico
        const updateData = {
            ...data,
            category,
            subcategory,
            sizes: productType === 'physical' ? sizes : undefined
        };

        const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });
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

const uploadProductImage = async (req, res, next) => {
    try {
        const productId = req.params.identifier;
        const { type } = req.params;

        // Verifica que el producto exista
        const product = await Product.findById(productId);
        if (!product) {
            return next(new ErrorHandler(404, 'Product not found.'));
        }

        if (type === 'cover') {
            // Procesa la imagen de portada
            const coverImage = req.file.filename; // Obtén el nombre del archivo subido
            product.coverImage = coverImage; // Actualiza el campo coverImage del producto

        } else if (type === 'gallery') {
            // Procesa las imágenes de la galería
            if (req.files && req.files.length > 0) {
                const imageUrls = req.files.map(file => ({
                    imageUrl: file.filename
                }));

                // Añade las nuevas imágenes a la galería existente
                product.gallery.push(...imageUrls);
            }
        } else {
            return next(new ErrorHandler(400, 'Invalid type specified.'));
        }

        // Guarda los cambios en la base de datos
        await product.save();

        // Responde exitosamente según el tipo de imagen procesada
        if (type === 'cover') {
            return handleSuccessfulResponse('Cover image uploaded successfully', { coverImage: product.coverImage })(req, res);
        } else if (type === 'gallery') {
            return handleSuccessfulResponse('Gallery images uploaded successfully', { gallery: product.gallery })(req, res);
        }
    } catch (error) {
        return handleErrorResponse(error, req, res);
    }
};

const getProductImage = async (req, res, next) => {
    try {
        const productId = req.params.identifier;
        const { type, imageId } = req.params; // Se añade imageId para identificar una imagen específica de la galería

        const product = await Product.findById(productId);

        if (!product) {
            return next(new ErrorHandler(404, 'Product not found.'));
        }

        let imagePath;

        if (type === 'cover') {
            if (!product.coverImage) {
                return next(new ErrorHandler(404, 'Cover image not found.'));
            }
            // Asegúrate de apuntar al directorio correcto de productos
            imagePath = path.join(__dirname, '..', 'uploads', 'products', product.coverImage);

        } else if (type === 'gallery') {
            // Busca la imagen específica dentro de la galería usando imageId
            const galleryImage = product.gallery.find(img => img._id.toString() === imageId);

            if (!galleryImage) {
                return next(new ErrorHandler(404, 'Gallery image not found.'));
            }
            imagePath = path.join(__dirname, '..', 'uploads', 'products', galleryImage.imageUrl);
        } else {
            return next(new ErrorHandler(400, 'Invalid type specified.'));
        }

        res.sendFile(imagePath, (err) => {
            if (err) {
                return next(new ErrorHandler(500, 'Failed to send product image.'));
            }
        });
    } catch (error) {
        return handleErrorResponse(error, req, res);
    }
};

const deleteProductImage = async (req, res, next) => {
    try {
        const productId = req.params.identifier;
        console.log(`Attempting to delete product image for product ID: ${productId}`);

        const product = await Product.findById(productId);
        console.log(`Product found: ${product ? product._id : 'not found'}`);

        if (!product || !product.coverImage) {  // Asegúrate de que estás verificando el campo correcto
            console.log('Product image not found.');
            return next(new ErrorHandler(404, 'Product image not found.'));
        }

        // Asegúrate de apuntar al directorio correcto de productos
        const imagePath = path.join(__dirname, '..', 'uploads', 'products', product.coverImage);
        console.log(`Image path resolved: ${imagePath}`);

        // Eliminar la imagen del sistema de archivos
        try {
            await fs.unlink(imagePath);
            console.log(`Successfully deleted file: ${imagePath}`);

            // Eliminar la referencia de la imagen en la base de datos
            product.coverImage = null;
            await product.save();
            console.log('Product image URL reference removed.');

            return handleSuccessfulResponse('Product image deleted successfully.')(req, res);
        } catch (err) {
            console.error(`Failed to delete file: ${imagePath}`, err);
            return next(new ErrorHandler(500, 'Failed to delete product image from the server.'));
        }
    } catch (error) {
        console.error('Error in deleteProductImage:', error);
        return handleErrorResponse(error, req, res);
    }
};

module.exports = {
    createProduct,
    listAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getProductImage,
    uploadProductImage,
    deleteProductImage
};
