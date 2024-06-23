"use strict";

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Cargar el archivo .env desde la ruta correcta
const mongoose = require('mongoose');
const Role = require("../models/roleModel");
const Permission = require("../models/permissionModel");
const logger = require('../helpers/logHelper');

// Verificar que la variable de entorno se cargue correctamente
console.log('MONGODB_URI:', process.env.MONGODB_URI);

// Asegurarse de que el directorio de logs exista
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        logger.info('Connected to the MongoDB database.');
        initializeRolesAndPermissions().then(() => {
            logger.info('Initialization complete.');
            process.exit();
        });
    })
    .catch(err => {
        logger.error('Failed to connect to the database', err);
        process.exit();
    });

/**
 * Inicializar roles y permisos en la base de datos
 */
async function initializeRolesAndPermissions() {
    try {
        const permissions = [
            { name: 'create_role', action: 'create', resource: 'role' },
            { name: 'read_roles', action: 'read', resource: 'role' },
            { name: 'update_role', action: 'update', resource: 'role' },
            { name: 'delete_role', action: 'delete', resource: 'role' },
            { name: 'create_permission', action: 'create', resource: 'permission' },
            { name: 'read_permissions', action: 'read', resource: 'permission' },
            { name: 'update_permission', action: 'update', resource: 'permission' },
            { name: 'delete_permission', action: 'delete', resource: 'permission' },
            { name: 'create_master_admin', action: 'create', resource: 'masterAdmin' },
            { name: 'create_user', action: 'create', resource: 'user' },
            { name: 'read_user', action: 'read', resource: 'user' },
            { name: 'read_user_by_id', action: 'read', resource: 'user' },
            { name: 'read_all_users', action: 'read', resource: 'user' },
            { name: 'read_user_image', action: 'read', resource: 'userImage' },
            { name: 'update_user', action: 'update', resource: 'user' },
            { name: 'delete_user', action: 'delete', resource: 'user' },
            { name: 'read', action: 'read', resource: 'geo' },
            { name: 'create_alert', action: 'create', resource: 'alert' },
            { name: 'read_alert', action: 'read', resource: 'alert' },
            { name: 'update_alert', action: 'update', resource: 'alert' },
            { name: 'delete_alert', action: 'delete', resource: 'alert' },
            { name: 'create_message', action: 'create', resource: 'message' },
            { name: 'read_message', action: 'read', resource: 'message' },
            { name: 'update_message', action: 'update', resource: 'message' },
            { name: 'delete_message', action: 'delete', resource: 'message' },
            { name: 'read_audit_log', action: 'read', resource: 'auditLog' },
            { name: 'delete_audit_log', action: 'delete', resource: 'auditLog' }
        ];

        // Crear o actualizar permisos
        for (let permission of permissions) {
            const permExists = await Permission.findOne({ name: permission.name });
            if (!permExists) {
                await Permission.create(permission);
            }
        }

        // Roles y sus permisos asignados
        const roles = [
            {
                name: 'MasterAdministrator',
                permissions: await Permission.find().select('_id')
            },
            {
                name: 'Developer',
                permissions: await Permission.find({
                    name: {
                        $in: [
                            'create_role', 'read_roles', 'update_role', 'delete_role',
                            'create_permission', 'read_permissions', 'update_permission', 'delete_permission',
                            'read_audit_log', 'delete_audit_log' // Añadido para Developer
                        ]
                    }
                }).select('_id')
            },
            {
                name: 'Registered',
                permissions: await Permission.find({
                    name: { $in: ['read_user', 'read_user_by_id', 'read_all_users', 'read_user_image', 'update_user'] }
                }).select('_id')
            },
            {
                name: 'Editor',
                permissions: await Permission.find({
                    name: {
                        $in: ['create_alert', 'read_alert', 'update_alert', 'delete_alert',
                            'create_message', 'read_message', 'update_message', 'delete_message']
                    }
                }).select('_id')
            },
            {
                name: 'Guest',
                permissions: await Permission.find({
                    name: {
                        $in: ['read_user', 'read_user_by_id', 'read_all_users', 'read_user_image',
                            'read_alert', 'read_message']
                    }
                }).select('_id')
            }
        ];

        // Crear o actualizar roles y asignar permisos
        for (let role of roles) {
            let roleExists = await Role.findOne({ name: role.name });
            if (!roleExists) {
                await Role.create(role);
            } else {
                roleExists.permissions = role.permissions;
                await roleExists.save();
            }
        }
    } catch (error) {
        logger.error('Initialization error:', error);
        process.exit(1);
    }
}
