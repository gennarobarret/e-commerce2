"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SubcategorySchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    description: {
        type: String,
        trim: true,
        required: false // La descripción es opcional
    }
}, { timestamps: true });

module.exports = mongoose.model("Subcategory", SubcategorySchema);
