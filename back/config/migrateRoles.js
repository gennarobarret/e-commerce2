
// migrateRoles.js
require('dotenv').config();

"use strict";

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/userModel'); // Actualizado
const logger = require('../helpers/logHelper'); // Actualizado

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs'); // Actualizado
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        logger.info('Connected to the MongoDB database.');
        migrateUserRoles().then(() => {
            logger.info('Role migration complete.');
            process.exit();
        });
    })
    .catch(err => {
        logger.error('Failed to connect to the database', err);
        process.exit(1);
    });

/**
 * Migrate user roles from array to single role field
 */
async function migrateUserRoles() {
    try {
        const users = await User.find({
            $or: [
                { 'role.1': { $exists: true } }, // Usuarios con más de un rol
                { 'role.0': { $exists: true } }  // Usuarios con al menos un rol
            ]
        });

        for (const user of users) {
            user.role = user.role[0] || null; // Selecciona el primer rol si existe
            await user.save();
            logger.info(`Updated user ${user.userName} with single role.`);
        }
    } catch (error) {
        logger.error('Migration error:', error);
        process.exit(1);
    }
}

