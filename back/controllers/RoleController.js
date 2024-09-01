"use strict";

const Role = require("../models/roleModel");
const AuditLog = require('../models/auditLogModel');
const { validateRole } = require('../helpers/validateHelper');
const { ErrorHandler, handleErrorResponse, handleSuccessfulResponse } = require("../helpers/responseManagerHelper");

const notificationService = require('../services/notificationService');

const getRoleById = async (req, res) => {
    try {
        const roleId = req.params.id;
        const role = await Role.findById(roleId).populate('permissions');

        if (!role) {
            return res.status(404).json({
                status: 'error',
                message: 'Role not found',
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Role retrieved successfully',
            data: role  // Aquí envolvemos el objeto role dentro de un objeto llamado "role"
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Server error',
            error: error.message
        });
    }
};

const createRole = async (req, res) => {
    try {
        const userId = req.user.sub;
        console.log("🚀 ~ createRole ~ userId:", userId)
        if (!userId) {
            return res.status(401).send({ message: "Access Denied" });
        }

        const { error } = validateRole(req.body);
        if (error) {
            throw new ErrorHandler(400, error.details[0].message);
        }

        const { name, permissions } = req.body;
        let role = await Role.findOne({ name });
        if (role) {
            throw new ErrorHandler(400, `Role ${name} already exists.`);
        }
        role = new Role({ name, permissions });
        await role.save(userId);

        // Registro de auditoría
        await AuditLog.create({
            action: 'CREATE',
            by: userId,
            targetDoc: role._id,
            targetType: 'Role',
            alertLevel: 'Low',
            apiPath: req.originalUrl,
            details: {
                message: `Role ${name} created successfully`,
            },
            ipAddress: req.ip
        });

        // Crear notificación
        const notification = await notificationService.createNotification({
            userId,
            icon: 'plus-circle',
            message: `Role '${name}' created successfully.`,
            type: 'success'
        });

        console.log('Notification created and emitted:', notification);

        handleSuccessfulResponse("Role created successfully", { role })(req, res);
    } catch (error) {
        handleErrorResponse(error, req, res);
    }
};

const updateRole = async (req, res) => {
    try {
        const userId = req.user.sub;
        if (!userId) {
            return res.status(401).send({ message: "Access Denied" });
        }

        const { error } = validateRole(req.body);
        if (error) {
            throw new ErrorHandler(400, error.details[0].message);
        }

        const { name, permissions } = req.body;
        let role = await Role.findById(req.params.id);
        if (!role) {
            throw new ErrorHandler(404, "Role not found");
        }

        if (role.name === "MasterAdministrator") {
            const existingPermissions = role.permissions.map(id => id.toString());
            const newPermissions = permissions.map(id => id.toString());

            const allExistingIncluded = existingPermissions.every(p => newPermissions.includes(p));

            if (!allExistingIncluded) {
                throw new ErrorHandler(403, "Cannot remove existing permissions from MasterAdministrator role.");
            }
        }

        role.name = name;
        role.permissions = permissions;
        await role.saveWithAudit(userId);

        // Registro de auditoría
        await AuditLog.create({
            action: 'UPDATE',
            by: userId,
            targetDoc: role._id,
            targetType: 'Role',
            alertLevel: 'Medium',
            apiPath: req.originalUrl,
            details: {
                message: `Role ${name} updated successfully`,
            },
            ipAddress: req.ip
        });

        // Crear notificación
        const notification = await notificationService.createNotification({
            userId,
            icon: 'edit',
            message: `Role '${name}' updated successfully.`,
            type: 'info'
        });

        console.log('Notification created and emitted:', notification);

        handleSuccessfulResponse("Role updated successfully", { role })(req, res);
    } catch (error) {
        handleErrorResponse(error, req, res);
    }
};

const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        const roleToDelete = await Role.findOneAndDelete({ _id: id });
        if (!roleToDelete) {
            throw new ErrorHandler(404, "Role not found");
        }

        const userId = req.user.sub;

        await AuditLog.create({
            action: 'DELETE',
            by: userId,
            targetDoc: roleToDelete._id,
            targetType: 'Role',
            alertLevel: 'High',
            apiPath: req.originalUrl,
            details: {
                message: "Role deleted successfully"
            },
            ipAddress: req.ip
        });

        // Crear notificación
        const notification = await notificationService.createNotification({
            userId,
            icon: 'trash',
            message: `Role '${roleToDelete.name}' deleted successfully.`,
            type: 'warning'
        });

        console.log('Notification created and emitted:', notification);

        handleSuccessfulResponse("Role deleted successfully", { id: roleToDelete._id })(req, res);
    } catch (error) {
        handleErrorResponse(error, req, res);
    }
};

const listRoles = async (req, res) => {
    try {
        const roles = await Role.find().populate('permissions');
        // Responder directamente con el array de roles
        res.status(200).json({
            status: "success",
            message: "Roles listed successfully",
            data: roles
        });

        // Registro de auditoría (opcional)
        // await AuditLog.create({
        //     action: 'LIST_ROLES',
        //     by: req.user ? req.user.sub : 'system',
        //     targetType: 'Role',
        //     alertLevel: 'Low',
        //     apiPath: req.originalUrl,
        //     details: {
        //         message: "Roles listed successfully"
        //     },
        //     ipAddress: req.ip
        // });

    } catch (error) {
        handleErrorResponse(error, req, res);
    }
};

module.exports = {
    createRole,
    updateRole,
    deleteRole,
    listRoles,
    getRoleById
};
