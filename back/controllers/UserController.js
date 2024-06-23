"use strict";

// Native Node.js modules
const fs = require('fs').promises;
const path = require("path");

// External modules (npm)
const mongoose = require('mongoose');

// Models (Internal modules)
const User = require("../models/userModel");
const Role = require("../models/roleModel");
const Alert = require('../models/alertModel');

// utilities (Internal modules)
const { sendVerificationEmail } = require('../helpers/emailServiceHelper');

// Validation Helpers (Internal modules)
const { validateUser } = require("../helpers/validateHelper");

// Response and Error Handling (Internal modules)
const { ErrorHandler, handleErrorResponse, handleSuccessfulResponse } = require('../helpers/responseManagerHelper');

// Logging and Auditing (Internal modules)
const logger = require('../helpers/logHelper');
const { logAudit } = require('../helpers/logAuditHelper');


function getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',').shift() || req.socket.remoteAddress;
}

function getCleanUser(user) {
    return {
        id: user._id,
        userName: user.userName,
        firstName: user.firstName,
        lastName: user.lastName,
        emailAddress: user.emailAddress,
        role: user.role,
        profileImage: user.profileImage,
    };
};

const getUserIDByUserName = async (userName) => {
    try {
        const user = await User.findOne({ userName }).exec();
        if (!user) {
            console.log("User not found");
            return null;
        }
        return user._id.toString();  // Devuelve el ID como string
    } catch (error) {
        console.error("Error fetching user by userName:", error);
        throw error;
    }
};

const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
};

// CREATE MASTER ADMIN USER
const createMasterAdmin = async (req, res) => {
    try {
        // 1. Validate the input data
        const { error } = validateUser(req.body, { userNameRequired: true, emailAddressRequired: true, roleRequired: false, passwordRequired: true });
        if (error) {
            throw new ErrorHandler(400, error.details[0].message, req.originalUrl, req.method);
        }

        const { userName, firstName, lastName, emailAddress, password } = req.body;

        // 2. Verify if the MasterAdministrator role exists
        const masterAdminRole = await Role.findOne({ name: 'MasterAdministrator' });
        if (!masterAdminRole) {
            throw new ErrorHandler(400, "The MasterAdministrator role does not exist.", req.originalUrl, req.method);
        }

        // 3. Check if a Master Administrator already exists
        const masterAdminExists = await User.exists({ role: masterAdminRole._id });
        if (masterAdminExists) {
            const conflictLogMessage = `Attempt to create a Master Admin when one already exists: UserName=${userName}, Name=${firstName} ${lastName}, Email=${emailAddress}, Role=MasterAdministrator`;
            await logAudit(
                'ATTEMPT_CREATE_ADMIN',
                req.user ? req.user.userName : 'unknown',
                null,
                'User',
                'High',
                conflictLogMessage,
                getClientIp(req),
                req.originalUrl || ''
            );

            throw new ErrorHandler(400, "A Master Administrator is already registered.", req.originalUrl, req.method);
        }

        // 4. Create the MasterAdmin user
        const masterAdmin = new User({
            userName,
            firstName,
            lastName,
            emailAddress,
            password,
            role: masterAdminRole._id // Directly assign the MasterAdministrator role
        });

        // 5. Guardar el usuario y verificar que se haya guardado correctamente
        await masterAdmin.save();
        if (!masterAdmin._id) {
            throw new ErrorHandler(500, "Failed to save the master admin user.", req.originalUrl, req.method);
        }

        // 6. Populate the role to get the role name for display or logs
        await masterAdmin.populate('role'); // Populate the role field
        const roleName = masterAdmin.role.name;

        // 7. Crear y guardar la alerta
        const alert = new Alert({
            type: 'success',
            message: `Master Administrator created: ${masterAdmin.userName} (${masterAdmin.emailAddress})`,
            sender: req.user ? req.user._id : masterAdmin._id, // ID del usuario que realiza la acción
            recipients: [masterAdmin._id] // El MasterAdmin creado recibirá la alerta
        });
        await alert.save();

        // Emitir el evento de alerta a través de Socket.io, si está configurado
        if (req.io) {
            req.io.emit('alertCreated', alert);
        }

        // 8. Generate the configuration token
        const token = masterAdmin.generateConfigurationToken();
        console.log("🚀 ~ createMasterAdmin ~ token:", token)

        // 9. Send the verification email using the modular function
        // const emailSent = await sendVerificationEmail(masterAdmin, token);
        // if (!emailSent.success) {
        //     throw new ErrorHandler(500, 'Failed to send the verification email.', req.originalUrl, req.method);
        // }

        // Log the creation action in the audit log with a detailed message
        const creationLogMessage = `Master Admin created: UserName=${masterAdmin.userName}, Name=${masterAdmin.firstName} ${masterAdmin.lastName}, Email=${masterAdmin.emailAddress}, Role=${roleName}, ID=${masterAdmin._id}`;
        await logAudit(
            'CREATE_MASTER_ADMIN',
            req.user ? req.user.userName : 'system',
            masterAdmin._id,
            'User',
            'High',
            creationLogMessage,
            getClientIp(req),
            req.originalUrl || ''
        );

        // 10. Responder con éxito
        handleSuccessfulResponse("Master Administrator successfully created and alert sent.", { masterAdminId: masterAdmin._id, alertId: alert._id })(req, res);

    } catch (error) {
        // Log and handle errors
        logger.error('createMasterAdmin error:', error);
        handleErrorResponse(error, req, res);
    }
};

// CREATE USER
const createUser = async (req, res) => {
    try {
        // 1. Verificar la identidad del usuario que realiza la solicitud
        const requestingUserId = req.user ? req.user.sub : null;
        if (!requestingUserId) {
            return res.status(401).json(handleSuccessfulResponse("Access Denied", {}));
        }

        // 2. Extraer y validar los datos de entrada
        let data = req.body;

        // Verificar que role sea un ObjectId válido
        if (!data.role || !mongoose.Types.ObjectId.isValid(data.role)) {
            throw new ErrorHandler(400, "Role must be provided as a valid ObjectId.", req.originalUrl, req.method);
        }

        // Verificar que el ObjectId del rol existe en la base de datos
        const role = await Role.findById(data.role);
        if (!role) {
            throw new ErrorHandler(400, `Role with ID '${data.role}' does not exist.`, req.originalUrl, req.method);
        }

        // Reemplazar el campo role con un array que contenga el ObjectId
        data.role = [data.role]; // El esquema espera un array de ObjectIds

        // 3. Validar los datos después de la conversión a ObjectId
        const { error: validationError } = validateUser(data, { userNameRequired: true, emailAddressRequired: true, roleRequired: true, passwordRequired: true });
        if (validationError) {
            throw new ErrorHandler(400, validationError.details[0].message, req.originalUrl, req.method);
        }

        // 4. Verificar conflictos con usuarios existentes
        const existingUser = await User.findOne({
            $or: [
                { userName: { $regex: new RegExp('^' + data.userName + '$', 'i') } },
                { emailAddress: { $regex: new RegExp('^' + data.emailAddress + '$', 'i') } }
            ]
        });
        if (existingUser) {
            const conflictLogMessage = `Attempt to create user with conflicting data:-UserName:${data.userName}-Email:${data.emailAddress}`.trim();
            await logAudit(
                'ATTEMPT_CREATE_USER',
                req.user ? req.user.userName : 'unknown',
                null,
                'User',
                'Medium',
                conflictLogMessage,
                getClientIp(req),
                req.originalUrl || ''
            );

            throw new ErrorHandler(409, "Registration failed due to a conflict with existing data. Please review your information.", req.originalUrl, req.method);
        }

        // 5. Crear el objeto del usuario con el ObjectId del rol
        const userData = new User({
            ...data,
            createdBy: requestingUserId,
            verification: 'notVerified'
        });

        // 6. Guardar el usuario y verificar que se haya guardado correctamente
        await userData.save();
        if (!userData._id) {
            throw new ErrorHandler(500, "Failed to save the user.", req.originalUrl, req.method);
        }

        // 7. Registrar la creación del usuario en el log de auditoría
        const creationLogMessage = `User created:-UserName:${userData.userName} -Name:${userData.firstName},${userData.lastName} -Email:${userData.emailAddress} -ID:${userData._id}`.trim();
        await logAudit(
            'CREATE_USER',
            req.user ? req.user.userName : 'unknown',
            userData._id,
            'User',
            'Low',
            creationLogMessage,
            getClientIp(req),
            req.originalUrl || ''
        );

        // 8. Crear y guardar la alerta
        const alert = new Alert({
            type: 'info',
            message: `New user created: ${userData.userName} (${userData.emailAddress})`,
            sender: requestingUserId, // ID del usuario que realiza la acción
            recipients: [userData._id] // El usuario creado recibirá la alerta
        });
        await alert.save();

        // Emitir el evento de alerta a través de Socket.io, si está configurado
        if (req.io) {
            req.io.emit('alertCreated', alert);
        }

        // 9. Generar el token de configuración
        const token = userData.generateConfigurationToken();
        console.log("🚀 ~ createUser ~ token:", token)

        // 10. Enviar el email de verificación
        // const emailSent = await sendVerificationEmail(userData, token);
        // if (!emailSent.success) {
        //     throw new ErrorHandler(500, 'Failed to send the verification email.', req.originalUrl, req.method);
        // }

        // 11. Responder con éxito
        handleSuccessfulResponse("User created successfully and alert sent.", { userId: userData._id, alertId: alert._id })(req, res);

    } catch (error) {
        // Registrar y manejar errores
        // logger.error('createUser error:', error);
        handleErrorResponse(error, req, res);
    }
};

// GET USER PROFILE PICTURE
const getUserImage = async (req, res) => {
    try {
        // 1. Validar y sanitizar la entrada
        const profileImage = req.params.profileImage;
        if (!profileImage) {
            throw new ErrorHandler(400, "Profile image name is required", req.originalUrl, req.method);
        }

        // 2. Construir el path de la imagen
        const pathImg = path.resolve("./uploads/users/staffs", profileImage);

        // 3. Verificar si el archivo existe
        try {
            await fs.stat(pathImg);
        } catch (error) {
            if (error.code === 'ENOENT') {
                // Archivo no encontrado
                return handleSuccessfulResponse("Image not found", {})(req, res);
            }
            throw error;
        }

        // 4. Enviar el archivo como respuesta
        res.sendFile(pathImg);

    } catch (error) {
        // Manejar errores
        handleErrorResponse(error, req, res);
    }
};

// UPDATE USER PROFILE PICTURE
const updateUserImage = async (req, res) => {
    let file;
    try {
        // 1. Validar y sanitizar la entrada
        const userName = req.params.userName;
        const userIdToUpdate = await getUserIDByUserName(userName);
        if (!userIdToUpdate) {
            throw new ErrorHandler(404, "User not found", req.originalUrl, req.method);
        }

        if (!isValidObjectId(userIdToUpdate)) {
            throw new ErrorHandler(400, "Invalid user ID format", req.originalUrl, req.method);
        }

        const userToUpdate = await User.findById(userIdToUpdate);
        if (!userToUpdate) {
            const ipAddress = getClientIp(req);
            await logAudit('UPDATE_PROFILE_IMAGE_USER_NOT_FOUND', userIdToUpdate, userIdToUpdate, 'User', 'Medium', 'Attempt to update profile image for non-existing user.', ipAddress);
            throw new ErrorHandler(404, "User not found", req.originalUrl, req.method);
        }

        // 2. Obtener el archivo de imagen de la solicitud
        file = req.file;
        if (!file) {
            const ipAddress = getClientIp(req);
            await logAudit('UPDATE_PROFILE_IMAGE_NO_FILE_PROVIDED', userIdToUpdate, userIdToUpdate, 'User', 'Medium', 'No profile image file provided for update attempt.', ipAddress);
            throw new ErrorHandler(400, "No profile image file provided", req.originalUrl, req.method);
        }

        // 3. Verificar si la imagen antigua existe y eliminarla
        if (userToUpdate.profileImage) {
            const oldProfileImagePath = path.join('uploads', 'users', 'staffs', userToUpdate.profileImage);
            try {
                await fs.access(oldProfileImagePath);
                await fs.unlink(oldProfileImagePath);
            } catch (err) {
                if (err.code !== 'ENOENT') {
                    throw new ErrorHandler(500, "Failed to delete old profile image", req.originalUrl, req.method, err.message);
                }
            }
        }

        // 4. Actualizar la propiedad de imagen de perfil del usuario
        userToUpdate.profileImage = file.filename;
        await userToUpdate.save();

        // 5. Registrar la auditoría
        const ipAddress = getClientIp(req);
        await logAudit('UPDATE_PROFILE_IMAGE', userIdToUpdate, userIdToUpdate, 'User', 'Medium', 'Profile image updated.', ipAddress);

        // 6. Responder con éxito
        handleSuccessfulResponse("Profile image updated successfully", { profileImage: userToUpdate.profileImage })(req, res);

    } catch (error) {
        // Manejar errores y enviar respuesta de error
        if (file && file.path) {
            // Eliminar el archivo temporal si existe
            try {
                await fs.unlink(file.path);
            } catch (err) {
                console.error(`Failed to delete temp file: ${err.message}`);
            }
        }
        handleErrorResponse(error, req, res);
    }
};
// GET USER DATA
const getUser = async (req, res) => {
    try {
        // 1. Validar y sanitizar la entrada
        const email = req.user ? req.user.emailAddress : null;
        if (!email) {
            logger.warn("getUser attempt without email in token");
            throw new ErrorHandler(400, "No email found in token", req.originalUrl, req.method);
        }

        // 2. Buscar el usuario por su email
        const user = await User.findOne(
            { emailAddress: email },
            'userName firstName lastName emailAddress authMethod isActive profileImage emailNotifications role organizationName countryAddress stateAddress phoneNumber birthday identification additionalInfo'
        )
            .populate({ path: 'role', select: 'name' })
            .populate({ path: 'countryAddress', select: 'name' })
            .populate({ path: 'stateAddress', select: 'province_name' });

        if (!user) {
            logger.info(`getUser attempt for non-existing user: ${email}`);
            await logAudit('GET_USER_ATTEMPT_FAIL', req.user ? req.user.sub : 'unknown', null, 'User', 'Medium', `User not found for email: ${email}`, getClientIp(req), req.originalUrl || '');
            throw new ErrorHandler(404, "User not found", req.originalUrl, req.method);
        }

        // 3. Formatear los datos del usuario para la respuesta
        const userData = {
            ...user.toObject(),
            role: user.role ? user.role.name : 'No role',
            countryAddress: user.countryAddress ? { _id: user.countryAddress._id, name: user.countryAddress.name } : { _id: null, name: 'No country found' },
            stateAddress: user.stateAddress ? { _id: user.stateAddress._id, name: user.stateAddress.province_name } : { _id: null, name: 'No state/province/district/community found' },
        };

        // Log successful retrieval
        logger.info(`User retrieved: ${userData.userName}`);

        // 4. Auditar el éxito de la recuperación del usuario
        // const targetDoc = mongoose.Types.ObjectId.isValid(req.user.sub) ? req.user.sub : null;
        // await logAudit('GET_USER_SUCCESS', user._id, targetDoc, 'User', 'Low', 'User data retrieved successfully', getClientIp(req), req.originalUrl || '');

        // 5. Responder con éxito
        handleSuccessfulResponse("User found", userData)(req, res);
    } catch (error) {
        // Manejar errores
        logger.error(`getUser error: ${error.message}`);
        handleErrorResponse(error, req, res);
    }
};

// UPDATE USER INFO
const updateUser = async (req, res) => {
    try {
        // 1. Validar y sanitizar la entrada
        const emailAddress = req.user ? req.user.emailAddress : null;
        if (!emailAddress) {
            throw new ErrorHandler(401, "Access Denied", req.originalUrl, req.method);
        }

        const userIdToUpdate = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(userIdToUpdate)) {
            throw new ErrorHandler(400, "Invalid User ID format", req.originalUrl, req.method);
        }

        // 2. Obtener datos del cuerpo de la solicitud
        let data = req.body;

        // Verificar que los datos están llegando correctamente
        console.log("🚀 ~ updateUser ~ data:", data);

        // Eliminar campos sensibles de data para que no sean actualizados
        delete data.userName;
        delete data.emailAddress;
        delete data.role;

        // 3. Validar los datos recibidos
        const { error: validationError } = validateUser(data, {
            passwordRequired: false,
            userNameRequired: false,
            emailAddressRequired: false,
            roleRequired: false,
            isNewUser: false
        });

        if (validationError) {
            throw new ErrorHandler(400, validationError.details[0].message, req.originalUrl, req.method);
        }

        // 4. Buscar usuario por ID
        let userToUpdate = await User.findById(userIdToUpdate);
        if (!userToUpdate) {
            throw new ErrorHandler(404, "User not found.", req.originalUrl, req.method);
        }

        // 5. Campos que pueden ser actualizados
        const fieldsToUpdate = [
            "firstName", "lastName", "organizationName", "countryAddress",
            "stateAddress", "phoneNumber", "birthday",
            "identification", "additionalInfo",
            "emailNotifications"
        ];

        // Actualizar solo los campos permitidos
        fieldsToUpdate.forEach(field => {
            if (data.hasOwnProperty(field)) {
                userToUpdate[field] = data[field];
            }
        });

        // 6. Guardar los cambios
        await userToUpdate.save();

        // Filtrar datos sensibles antes de la respuesta
        const filteredUserData = (({
            password, __v, verification, authMethod, configurationToken, configurationTokenExpires,
            googleId, loginAttempts, passwordHistory, lockUntil, verificationCode, verificationCodeExpires, ...rest
        }) => rest)(userToUpdate.toObject());

        // 7. Responder con éxito
        handleSuccessfulResponse("User updated successfully", filteredUserData)(req, res);

        // 8. Registrar la auditoría
        await logAudit('UPDATE', req.user._id, userToUpdate._id, 'User', 'info', `User ${userToUpdate._id} updated by ${req.user._id}`, getClientIp(req));

    } catch (error) {
        // Manejar errores
        handleErrorResponse(error, req, res);
    }
};

// GET USER BY ID
const getUserById = async (req, res) => {
    try {
        // 1. Validar y sanitizar la entrada
        const userId = req.params.userId;
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            throw new ErrorHandler(400, "Invalid or missing User ID", req.originalUrl, req.method);
        }

        // 2. Buscar el usuario por su ID
        const user = await User.findById(userId).select('-password'); // Excluir el campo password
        if (!user) {
            throw new ErrorHandler(404, "User not found", req.originalUrl, req.method);
        }

        // 3. Responder con el usuario encontrado
        handleSuccessfulResponse("User retrieved successfully", user)(req, res);

    } catch (error) {
        // Manejar errores
        handleErrorResponse(error, req, res);
    }
};

// LIST USER DATA
const listAllUsers = async (req, res) => {
    try {
        // 1. Construir la consulta de búsqueda basada en los parámetros de filtro
        let query = {};
        if (req.query.type && req.query.filter) {
            // Usar una expresión regular para realizar la búsqueda con insensibilidad a mayúsculas/minúsculas
            query[req.query.type] = new RegExp(req.query.filter, 'i');
        }

        // 2. Buscar los usuarios en la base de datos
        const users = await User.find(query);

        // 3. Sanitizar los datos de los usuarios eliminando campos sensibles
        const sanitizedUsers = users.map(user => {
            let userObject = user.toObject();
            delete userObject.passwordHistory;
            delete userObject.loginAttempts;
            delete userObject.configurationToken;
            delete userObject.resetPasswordToken;
            delete userObject.verificationCode;
            delete userObject.verificationCodeExpires;
            delete userObject.configurationTokenExpires;
            delete userObject.emailNotifications;
            delete userObject.lockUntil;
            delete userObject.resetPasswordExpires;
            delete userObject.__v;
            delete userObject.verification;
            return userObject;
        });

        // 4. Responder con éxito
        handleSuccessfulResponse("Users listed successfully", sanitizedUsers)(req, res);

        // Registrar en el log de auditoría la operación de listar usuarios
        await logAudit('LIST_USERS', req.user ? req.user._id : 'system', null, 'User', 'Low', 'Listed all users with filters', getClientIp(req), req.originalUrl || '');

    } catch (error) {
        // Manejar errores
        handleErrorResponse(error, req, res);
    }
};

// DELETE USER
const deleteUser = async (req, res) => {
    try {
        // 1. Validar la entrada
        const userId = req.user ? req.user.sub : null; // ID del usuario que intenta realizar la acción
        if (!userId) {
            throw new ErrorHandler(401, "Access Denied", req.originalUrl, req.method);
        }

        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ErrorHandler(400, "Invalid User ID format", req.originalUrl, req.method);
        }

        // 2. Buscar el usuario a eliminar
        const userToDelete = await User.findById(id);
        if (!userToDelete) {
            return handleSuccessfulResponse("User not found", {})(req, res);
        }

        // 3. Determinar el nivel de alerta y guardar la auditoría antes de eliminar el usuario
        const alertLevel = userToDelete.determineAlertLevel ? userToDelete.determineAlertLevel('DELETE') : 'info'; // Verifica si el método existe
        await logAudit('DELETE', userId, id, 'User', alertLevel, `User ${id} deleted by ${userId}`, getClientIp(req), req.originalUrl || '');

        // 4. Eliminar el usuario
        await userToDelete.remove();

        // 5. Responder con éxito
        handleSuccessfulResponse("User deleted successfully", { id })(req, res);

    } catch (error) {
        // Manejar errores
        handleErrorResponse(error, req, res);
    }
};

// UPDATE USER ACTIVE STATUS
const updateUserActiveStatus = async (req, res) => {
    const { userId } = req.params; // ID del usuario a actualizar
    const { isActive } = req.body; // Nuevo estado de actividad
    const modifierUserId = req.user ? req.user.sub : null; // ID del usuario que realiza la acción

    try {
        // 1. Validar la entrada
        if (typeof isActive !== 'boolean') {
            throw new ErrorHandler(400, "Invalid isActive value. It should be a boolean.", req.originalUrl, req.method);
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new ErrorHandler(400, "Invalid User ID format", req.originalUrl, req.method);
        }

        // 2. Buscar el usuario a actualizar
        const user = await User.findById(userId);
        if (!user) {
            throw new ErrorHandler(404, "User not found", req.originalUrl, req.method);
        }

        // 3. Actualizar el estado activo
        user.isActive = isActive;

        // 4. Determinar el nivel de alerta y guardar la auditoría
        const alertLevel = user.determineAlertLevel ? user.determineAlertLevel('UPDATE_ACTIVE_STATUS') : 'info';
        await logAudit('UPDATE_ACTIVE_STATUS', modifierUserId, userId, 'User', alertLevel, `User ${userId} active status updated to ${isActive} by ${modifierUserId}`, getClientIp(req), req.originalUrl || '');

        // Guardar los cambios con la auditoría
        await user.save();

        // 5. Responder con éxito
        handleSuccessfulResponse("User active status updated successfully.", { userId, isActive })(req, res);
    } catch (error) {
        // Manejar errores
        handleErrorResponse(error, req, res);
    }
};

// UPDATE MULTIPLE USERS ACTIVE STATUS
const updateMultipleUserActiveStatus = async (req, res) => {
    const { userIds, isActive } = req.body; // `userIds` debe ser un arreglo de IDs y `isActive` el nuevo estado
    const modifierUserId = req.user ? req.user.sub : null; // ID del usuario que realiza la acción

    try {
        // 1. Validar la entrada
        if (!Array.isArray(userIds) || userIds.length === 0) {
            throw new ErrorHandler(400, "Invalid input: userIds must be a non-empty array.", req.originalUrl, req.method);
        }

        if (typeof isActive !== 'boolean') {
            throw new ErrorHandler(400, "Invalid isActive value. It should be a boolean.", req.originalUrl, req.method);
        }

        // Validar que todos los IDs en el arreglo sean ObjectId válidos
        userIds.forEach(id => {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new ErrorHandler(400, `Invalid User ID format: ${id}`, req.originalUrl, req.method);
            }
        });

        // 2. Buscar todos los usuarios por sus IDs
        const users = await User.find({ _id: { $in: userIds } });

        if (users.length === 0) {
            throw new ErrorHandler(404, "No users found.", req.originalUrl, req.method);
        }

        // 3. Actualizar el estado activo de cada usuario y registrar en el log de auditoría
        for (let user of users) {
            user.isActive = isActive;
            const alertLevel = user.determineAlertLevel ? user.determineAlertLevel('BULK_UPDATE_ACTIVE_STATUS') : 'info';
            await logAudit('BULK_UPDATE_ACTIVE_STATUS', modifierUserId, user._id, 'User', alertLevel, `User ${user._id} active status updated to ${isActive} by ${modifierUserId}`, getClientIp(req), req.originalUrl || '');
            await user.save();
        }

        // 4. Responder con éxito
        handleSuccessfulResponse("Users updated successfully.", { updatedCount: users.length })(req, res);

    } catch (error) {
        // Manejar errores
        handleErrorResponse(error, req, res);
    }
};

module.exports = {
    createMasterAdmin,
    createUser,
    getUser,
    getUserById,
    getUserImage,
    updateUser,
    updateUserImage,
    listAllUsers,
    deleteUser,
    updateUserActiveStatus,
    updateMultipleUserActiveStatus
};
