"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SizeSchema = new Schema({
    weight: {
        type: Number,  // Peso en unidades especificadas (ej. kg, g)
        required: false
    },
    height: {
        type: Number,  // Alto en unidades especificadas (ej. cm, m)
        required: false
    },
    width: {
        type: Number,  // Ancho en unidades especificadas (ej. cm, m)
        required: false
    },
    length: {
        type: Number,  // Largo en unidades especificadas (ej. cm, m)
        required: false
    }
}, { _id: false });  // _id se establece en falso porque no necesitamos un ID único para cada tamaño dentro del producto

const ProductSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    subcategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subcategory',
        required: false
    },
    manufacturer: {
        name: {
            type: String,
            trim: true
        },
        brand: {
            type: String,
            trim: true
        }
    },
    gallery: [{
        imageUrl: {
            type: String,
            trim: true
        }
    }],
    price: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,  // Descuento en porcentaje
        default: 0
    },
    stock: {
        type: Number,
        required: true,
        default: 0
    },
    orders: {
        type: Number,
        default: 0  // Número de órdenes realizadas para este producto
    },
    colors: [{
        type: String,
        trim: true
    }],
    sizes: [SizeSchema],  // Array de objetos que contienen dimensiones
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model("Product", ProductSchema);
