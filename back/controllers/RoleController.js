"use strict";

const Role = require("../models/roleModel");
const AuditLog = require('../models/auditLogModel');
const { validateRole } = require('../helpers/validateHelper');
const logger = require('../helpers/logHelper');
const { ErrorHandler, handleErrorResponse, handleSuccessfulResponse } = require("../helpers/responseManagerHelper");

const createRole = async (req, res) => {
    try {
        const userId = req.user.sub;
        if (!userId) {
            console.log("🚀 ~ createRole ~ req.user:", req.user);
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
        await role.saveWithAudit(userId);

        handleSuccessfulResponse("Role created successfully", { role })(req, res);
    } catch (error) {
        handleErrorResponse(error, req, res);
    }
};

const updateRole = async (req, res) => {
    try {
        const userId = req.user.sub;
        if (!userId) {
            console.log("🚀 ~ updateRole ~ req.user:", req.user);
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
            details: {
                message: "Role deleted successfully"
            }
        });

        handleSuccessfulResponse("Role deleted successfully", { id: roleToDelete._id })(req, res);
    } catch (error) {
        handleErrorResponse(error, req, res);
    }
};

const listRoles = async (req, res) => {
    try {
        const roles = await Role.find().populate('permissions');
        handleSuccessfulResponse("Roles listed successfully", { roles })(req, res);
    } catch (error) {
        handleErrorResponse(error, req, res);
    }
};

module.exports = {
    createRole,
    updateRole,
    deleteRole,
    listRoles
};
