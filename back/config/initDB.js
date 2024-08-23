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
            // Permisos para roles
            { name: 'create_role', action: 'create', resource: 'role' },
            { name: 'read_roles', action: 'read', resource: 'role' },
            { name: 'update_role', action: 'update', resource: 'role' },
            { name: 'delete_role', action: 'delete', resource: 'role' },

            // Permisos para permisos
            { name: 'create_permission', action: 'create', resource: 'permission' },
            { name: 'read_permissions', action: 'read', resource: 'permission' },
            { name: 'update_permission', action: 'update', resource: 'permission' },
            { name: 'delete_permission', action: 'delete', resource: 'permission' },

            // Permisos para administración de usuarios
            { name: 'create_user', action: 'create', resource: 'user' },
            { name: 'read_user', action: 'read', resource: 'user' },
            { name: 'read_user_by_id', action: 'read', resource: 'user' },
            { name: 'read_all_users', action: 'read', resource: 'user' },
            { name: 'update_user', action: 'update', resource: 'user' },
            { name: 'delete_user', action: 'delete', resource: 'user' },

            // Permisos para gestión de productos
            { name: 'create_product', action: 'create', resource: 'product' },
            { name: 'read_product', action: 'read', resource: 'product' },
            { name: 'update_product', action: 'update', resource: 'product' },
            { name: 'delete_product', action: 'delete', resource: 'product' },

            // Permisos para gestión de inventarios
            { name: 'read_inventory', action: 'read', resource: 'inventory' },
            { name: 'update_inventory', action: 'update', resource: 'inventory' },

            // Permisos para gestión de pedidos
            { name: 'create_order', action: 'create', resource: 'order' },
            { name: 'read_order', action: 'read', resource: 'order' },
            { name: 'update_order', action: 'update', resource: 'order' },
            { name: 'delete_order', action: 'delete', resource: 'order' },

            // Permisos para gestión de pagos
            { name: 'create_payment', action: 'create', resource: 'payment' },
            { name: 'read_payment', action: 'read', resource: 'payment' },
            { name: 'update_payment', action: 'update', resource: 'payment' },
            { name: 'delete_payment', action: 'delete', resource: 'payment' },

            // Permisos para gestión de envíos
            { name: 'create_shipping', action: 'create', resource: 'shipping' },
            { name: 'read_shipping', action: 'read', resource: 'shipping' },
            { name: 'update_shipping', action: 'update', resource: 'shipping' },
            { name: 'delete_shipping', action: 'delete', resource: 'shipping' },

            // Permisos para categorías
            { name: 'create_category', action: 'create', resource: 'category' },
            { name: 'read_category', action: 'read', resource: 'category' },
            { name: 'update_category', action: 'update', resource: 'category' },
            { name: 'delete_category', action: 'delete', resource: 'category' },

            // Permisos para subcategorías
            { name: 'create_subcategory', action: 'create', resource: 'subcategory' },
            { name: 'read_subcategory', action: 'read', resource: 'subcategory' },
            { name: 'update_subcategory', action: 'update', resource: 'subcategory' },
            { name: 'delete_subcategory', action: 'delete', resource: 'subcategory' },

            // Permisos para logs de auditoría
            { name: 'read_audit_log', action: 'read', resource: 'auditLog' },
            { name: 'delete_audit_log', action: 'delete', resource: 'auditLog' },

            // Permisos para gestión de clientes
            { name: 'create_customer', action: 'create', resource: 'customer' },
            { name: 'read_customer', action: 'read', resource: 'customer' },
            { name: 'update_customer', action: 'update', resource: 'customer' },
            { name: 'delete_customer', action: 'delete', resource: 'customer' },

            // Permisos para informes y analítica
            { name: 'read_reports', action: 'read', resource: 'report' },
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
                name: 'Admin',
                permissions: await Permission.find({
                    name: {
                        $in: [
                            'create_role', 'read_roles', 'update_role', 'delete_role',
                            'create_permission', 'read_permissions', 'update_permission', 'delete_permission',
                            'create_user', 'read_user', 'update_user', 'delete_user',
                            'create_product', 'read_product', 'update_product', 'delete_product',
                            'create_category', 'read_category', 'update_category', 'delete_category',
                            'create_subcategory', 'read_subcategory', 'update_subcategory', 'delete_subcategory',
                            'create_order', 'read_order', 'update_order', 'delete_order',
                            'create_payment', 'read_payment', 'update_payment', 'delete_payment',
                            'create_shipping', 'read_shipping', 'update_shipping', 'delete_shipping',
                            'read_inventory', 'update_inventory',
                            'create_customer', 'read_customer', 'update_customer', 'delete_customer',
                            'read_reports'
                        ]
                    }
                }).select('_id')
            },
            {
                name: 'CustomerSupport',
                permissions: await Permission.find({
                    name: {
                        $in: [
                            'read_user', 'read_user_by_id', 'update_user',
                            'read_order', 'update_order', 'read_payment', 'update_payment',
                            'read_shipping', 'update_shipping', 'read_customer', 'update_customer'
                        ]
                    }
                }).select('_id')
            },
            {
                name: 'SalesManager',
                permissions: await Permission.find({
                    name: {
                        $in: [
                            'create_order', 'read_order', 'update_order', 'delete_order',
                            'create_payment', 'read_payment', 'update_payment', 'delete_payment',
                            'create_shipping', 'read_shipping', 'update_shipping', 'delete_shipping',
                            'read_reports'
                        ]
                    }
                }).select('_id')
            },
            {
                name: 'Customer',
                permissions: await Permission.find({
                    name: {
                        $in: [
                            'read_product', 'create_order', 'read_order', 'read_payment',
                            'read_shipping', 'read_user', 'update_user', 'read_customer'
                        ]
                    }
                }).select('_id')
            },
            {
                name: 'Guest',
                permissions: await Permission.find({
                    name: {
                        $in: [
                            'read_product', 'read_category', 'read_subcategory'
                        ]
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
