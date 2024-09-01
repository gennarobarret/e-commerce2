"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Esquema para las dimensiones de productos físicos
const SizeSchema = new Schema({
    weight: {
        type: Number,  // Peso en unidades especificadas (ej. kg, g)
        required: function () { return this.productType === 'physical'; }  // Solo requerido para productos físicos
    },
    height: {
        type: Number,  // Alto en unidades especificadas (ej. cm, m)
        required: function () { return this.productType === 'physical'; }  // Solo requerido para productos físicos
    },
    width: {
        type: Number,  // Ancho en unidades especificadas (ej. cm, m)
        required: function () { return this.productType === 'physical'; }  // Solo requerido para productos físicos
    },
    length: {
        type: Number,  // Largo en unidades especificadas (ej. cm, m)
        required: function () { return this.productType === 'physical'; }  // Solo requerido para productos físicos
    }
}, { _id: false });  // _id se establece en falso porque no necesitamos un ID único para cada tamaño dentro del producto

// Esquema principal del producto
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
    coverImage: {
        type: String,  // Imagen de portada del producto
        trim: true
    },
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
        required: function () { return this.productType === 'physical'; },  // Solo requerido para productos físicos
        default: 0
    },
    orders: {
        type: Number,
        default: 0  // Número de órdenes realizadas para este producto
    },
    visits: {
        type: Number,
        default: 0  // Número de visitas al producto
    },
    sales: {
        type: Number,
        default: 0  // Número de ventas realizadas para este producto
    },
    colors: [{
        type: String,
        trim: true
    }],
    sizes: {
        type: [SizeSchema],
        required: function () { return this.productType === 'physical'; }  // Solo requerido para productos físicos
    },
    productType: {
        type: String,
        enum: ['physical', 'virtual'],  // Definir tipos de producto
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    virtualProductDetails: {
        courseType: {
            type: String,  // Tipo de curso (ej. presencial, en línea)
            enum: ['online', 'offline', 'presential'],
            required: function () { return this.productType === 'virtual'; }  // Solo requerido para productos virtuales
        },
        duration: {
            type: Number,  // Duración del curso en horas
            required: function () { return this.productType === 'virtual'; }  // Solo requerido para productos virtuales
        },
        instructor: {
            type: String,  // Nombre del instructor
            trim: true,
            required: function () { return this.productType === 'virtual'; }  // Solo requerido para productos virtuales
        },
        platform: {
            type: String,  // Plataforma de entrega del curso (para cursos online)
            trim: true,
            required: function () { return this.productType === 'virtual' && this.virtualProductDetails.courseType === 'online'; }  // Requerido solo para cursos online
        },
        location: {
            type: String,  // Dirección o ubicación física (para cursos presenciales)
            trim: true,
            required: function () { return this.productType === 'virtual' && this.virtualProductDetails.courseType === 'presential'; }  // Requerido solo para cursos presenciales
        },
        schedule: {
            type: String,  // Horario del curso
            trim: true,
            required: function () { return this.productType === 'virtual'; }  // Requerido para cursos virtuales
        }
    }
}, { timestamps: true });

module.exports = mongoose.model("Product", ProductSchema);
