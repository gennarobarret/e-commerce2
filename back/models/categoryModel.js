const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Subcategory = require('./subcategoryModel');

const CategorySchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    slug: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true
    },
    imageUrl: {
        type: String,
        trim: true,
        required: false
    },
    description: {
        type: String,
        trim: true,
        required: false
    },
    subcategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subcategory',
        default: []
    }]
}, { timestamps: true });

CategorySchema.pre('remove', async function (next) {
    try {
        await Subcategory.deleteMany({ category: this._id });
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model('Category', CategorySchema);
