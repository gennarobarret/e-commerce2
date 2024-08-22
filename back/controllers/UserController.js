"use strict";

// Native Node.js modules
const fs = require('fs').promises;
const path = require("path");

// External modules (npm)
const mongoose = require('mongoose');

// Models (Internal modules)
const User = require("../models/userModel");
const Role = require("../models/roleModel");
const Country = require("../models/countriesModel");
const States = require("../models/statesModel");

// utilities (Internal modules)
const { resetPasswordUrl, sendVerificationEmail, sendPasswordResetEmail, verificationCodeUrl} = require('../helpers/emailServiceHelper');

// Validation Helpers (Internal modules)
const { validateUser } = require("../helpers/validateHelper");

// Response and Error Handling (Internal modules)
const { ErrorHandler, handleErrorResponse, handleSuccessfulResponse } = require('../helpers/responseManagerHelper');

// Logging and Auditing (Internal modules)
const logger = require('../helpers/logHelper');
const { logAudit } = require('../helpers/logAuditHelper');

// Services
const notificationService = require('../services/notificationService');
const { getImage } = require('../controllers/ImageController');
const { deleteImage } = require('../controllers/ImageController');

function getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',').shift() || req.socket.remoteAddress;
}


const updateUserProfileImageUrl = async (userId, imageUrl) => {
    try {
        // Actualizar el campo `imageUrl` en la base de datos para el usuario dado
        await User.findByIdAndUpdate(userId, { imageUrl });

    } catch (error) {
        console.error('Error updating user profile image:', error);
        throw new ErrorHandler(500, "Failed to update profile image.");
    }
};
    
const getUserProfileImage = async (req, res, next) => {
    try {
        // Establece los parámetros necesarios para obtener la imagen
        req.params.entityType = 'users';
        req.params.fileName = `${req.params.identifier}`; // Asume que el formato es .jpg, ajústalo según tus necesidades.
        // Llama al método getImage del ImageController
        await getImage(req, res);
    } catch (error) {
        next(error);
    }
};

const deleteUserProfileImage = async (req, res, next) => {
    try {
        // Establece los parámetros necesarios para eliminar la imagen
        req.params.entityType = 'users';
        req.params.fileName = `${req.params.identifier}.jpg`; // Asume que el formato es .jpg, ajústalo según tus necesidades.

        // Llama al método deleteImage del ImageController
        await deleteImage(req, res);
    } catch (error) {
        next(error);
    }
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

// LIST USER DATA
const listAllUsers = async (req, res) => {
    try {
        // 1. Construir la consulta de búsqueda basada en los parámetros de filtro
        let query = {};
        if (req.query.type && req.query.filter) {
            // Usar una expresión regular para realizar la búsqueda con insensibilidad a mayúsculas/minúsculas
            query[req.query.type] = new RegExp(req.query.filter, 'i');
        }

        // 2. Buscar los usuarios en la base de datos y popular los campos 'role', 'countryAddress', y 'stateAddress'
        const users = await User.find(query)
            .populate('role', 'name') // Poblar el nombre del rol
            .populate('countryAddress', 'name') // Poblar el nombre del país
            .populate('stateAddress', 'province_name'); // Poblar el nombre del estado

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

            // Reemplazar el campo role con el nombre del rol
            userObject.role = userObject.role.name;

            // Reemplazar el campo countryAddress y stateAddress con el nombre del país y estado
            if (userObject.countryAddress) {
                userObject.countryAddress = {
                    _id: userObject.countryAddress._id,
                    name: userObject.countryAddress.name,
                };
            }

            if (userObject.stateAddress) {
                userObject.stateAddress = {
                    _id: userObject.stateAddress._id,
                    province_name: userObject.stateAddress.province_name,
                };
            }

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

        // 7. Generate the configuration token
        const token = masterAdmin.generateConfigurationToken();
        console.log("🚀 ~ createMasterAdmin ~ token:", token)

        // 8. Send the verification email using the modular function
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

        // 8. Crear una notificación para el nuevo usuario
        const notification = await notificationService.createNotification({
            userId: masterAdmin._id,
            icon: 'user-plus',
            message: `Welcome ${masterAdmin.userName}!`,
            type: 'success'
        });

        console.log('Notification created and emitted:', notification); // Agregar log para depuración


        // 9. Responder con éxito
        handleSuccessfulResponse("Master Administrator successfully created.", { masterAdminId: masterAdmin._id })(req, res);

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

        // 2.1 Buscar el ObjectId del rol basado en su nombre
        const role = await Role.findOne({ name: data.role });
        if (!role) {
            throw new ErrorHandler(400, `Role with name '${data.role}' does not exist.`, req.originalUrl, req.method);
        }

        // Convertir a array de cadenas (ObjectId como string)
        data.role = [role._id.toString()]; // Convertir ObjectId a cadena y envolver en un array

        // 3. Validar los datos después de la conversión a ObjectId
        const { error: validationError } = validateUser(data, { userNameRequired: true, emailAddressRequired: true, roleRequired: true, passwordRequired: false });
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
            const conflictLogMessage = `Attempt to create user with conflicting data: -UserName:${data.userName} -Email:${data.emailAddress}`.trim();
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

        // 5. Crear el objeto del usuario
        const userData = new User({
            ...data,
            createdBy: requestingUserId,
            verification: 'notVerified',  // El usuario aún no está verificado
            isActive: false  // El usuario no está activado hasta que configure su contraseña
        });

        // 6. Generar el token de verificación y el código de verificación
        const verificationToken = userData.generatePasswordResetToken();
        const verificationCode = userData.generateVerificationCode();

        // 7. Guardar el usuario y verificar que se haya guardado correctamente
        await userData.save();

        if (!userData._id) {
            throw new ErrorHandler(500, "Failed to save the user.", req.originalUrl, req.method);
        }

        // 8. Registrar la creación del usuario en el log de auditoría
        const creationLogMessage = `User created: -UserName:${userData.userName} -Name:${userData.firstName},${userData.lastName} -Email:${userData.emailAddress} -ID:${userData._id}`.trim();
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

        // 9. Crear una notificación para el usuario creador
        const notification = await notificationService.createNotification({
            userId: requestingUserId,
            icon: 'user-plus',
            message: `User ${userData.userName} has been created successfully!`,
            type: 'success'
        });

        console.log('Notification created and emitted:', notification); // Agregar log para depuración

        // 10. Enviar el email para verificar la cuenta antes de configurar la contraseña
        const verificationUrl = verificationCodeUrl(verificationToken);
        const tokenExpiration = userData.resetPasswordExpires - Date.now();
        const emailSent = await sendPasswordResetEmail(userData.emailAddress, verificationUrl, verificationCode, tokenExpiration);
        if (!emailSent.success) {
            throw new ErrorHandler(500, 'Failed to send the verification email.', req.originalUrl, req.method);
        }

        // 11. Responder con éxito
        handleSuccessfulResponse("User created successfully. A verification email has been sent.", { userId: userData._id })(req, res);

    } catch (error) {
        handleErrorResponse(error, req, res);
    }
};

const registerUser = async (req, res) => {
    try {
        // Extraer y validar los datos de entrada
        let data = req.body;

        // Validar los datos del usuario
        const { error: validationError } = validateUser(data, { userNameRequired: true, emailAddressRequired: true, passwordRequired: true });
        if (validationError) {
            throw new ErrorHandler(400, validationError.details[0].message, req.originalUrl, req.method);
        }

        // Verificar si ya existe un usuario con el mismo nombre de usuario o correo
        const existingUser = await User.findOne({
            $or: [
                { userName: { $regex: new RegExp('^' + data.userName + '$', 'i') } },
                { emailAddress: { $regex: new RegExp('^' + data.emailAddress + '$', 'i') } }
            ]
        });
        if (existingUser) {
            throw new ErrorHandler(409, "User with provided details already exists.", req.originalUrl, req.method);
        }

        // Crear el objeto del usuario
        const userData = new User({
            ...data,
            verification: 'pending'
        });

        // Guardar el usuario
        await userData.save();

        // Enviar el correo de verificación
        const emailSent = await sendVerificationEmail(userData);
        if (!emailSent.success) {
            throw new ErrorHandler(500, 'Failed to send the verification email.', req.originalUrl, req.method);
        }

        // Responder con éxito
        handleSuccessfulResponse("User registered successfully. Please verify your email.", { userId: userData._id })(req, res);

    } catch (error) {
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
            'userName firstName lastName emailAddress authMethod isActive imageUrl emailNotifications role organizationName countryAddress stateAddress phoneNumber birthday identification additionalInfo'
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

// GET USER BY ID
const getUserById = async (req, res) => {
    try {
        // 1. Validar y sanitizar la entrada
        const userId = req.params.id;
        console.log("🚀 ~ getUserById ~ userId:", userId)

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            throw new ErrorHandler(400, "Invalid or missing User ID", req.originalUrl, req.method);
        }

        // 2. Buscar el usuario por su ID y seleccionar solo los campos necesarios
        const user = await User.findById(userId)
            .select('userName firstName lastName emailAddress authMethod isActive imageUrl emailNotifications role organizationName countryAddress stateAddress phoneNumber birthday identification additionalInfo')
            .populate({ path: 'role', select: 'name' })
            .populate({ path: 'countryAddress', select: 'name' })
            .populate({ path: 'stateAddress', select: 'province_name' });

        if (!user) {
            throw new ErrorHandler(404, "User not found", req.originalUrl, req.method);
        }

        // 3. Formatear los datos del usuario para la respuesta
        const userData = {
            ...user.toObject(),
            role: user.role ? user.role.name : 'No role',
            countryAddress: user.countryAddress ? { _id: user.countryAddress._id, name: user.countryAddress.name } : { _id: null, name: 'No country found' },
            stateAddress: user.stateAddress ? { _id: user.stateAddress._id, name: user.stateAddress.province_name } : { _id: null, name: 'No state/province/district/community found' },
        };

        // 4. Loggear la recuperación exitosa del usuario
        logger.info(`User retrieved: ${userData.userName}`);

        // 5. Responder con éxito
        handleSuccessfulResponse("User retrieved successfully", userData)(req, res);

    } catch (error) {
        // Manejar errores
        logger.error(`getUserById error: ${error.message}`);
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
        console.log("🚀 ~ updateUser ~ data:", data)

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
            "emailNotifications", "isActive"
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
        await logAudit(
            'UPDATE',
            req.user._id,
            userToUpdate._id,
            'User',
            'Medium',  // Cambia 'info' por un valor válido como 'Medium'
            `User ${userToUpdate._id} updated by ${req.user._id}`,
            getClientIp(req),
            req.originalUrl
        );


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

        // 2. Buscar y eliminar el usuario
        const userToDelete = await User.findByIdAndDelete(id);
        if (!userToDelete) {
            return handleSuccessfulResponse("User not found", {})(req, res);
        }

        // 3. guardar la auditoría después de eliminar el usuario
        await logAudit(
            'DELETE',
            userId,
            id,
            'User',
            'High',  // Cambiar 'delete' a un valor válido como 'High'
            `User ${id} deleted by ${userId}`,
            getClientIp(req),
            req.originalUrl || ''
        );

        // 4. Responder con éxito
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

        // 4. guardar la auditoría
        await logAudit('UPDATE_ACTIVE_STATUS', modifierUserId, userId, 'User', 'updateactive', `User ${userId} active status updated to ${isActive} by ${modifierUserId}`, getClientIp(req), req.originalUrl || '');

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
            await logAudit('BULK_UPDATE_ACTIVE_STATUS', modifierUserId, user._id, 'User', 'updateMultipleUserActiveStatus', `User ${user._id} active status updated to ${isActive} by ${modifierUserId}`, getClientIp(req), req.originalUrl || '');
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
    registerUser,
    getUser,
    getUserById,
    updateUser,
    updateUserProfileImageUrl,
    listAllUsers,
    deleteUser,
    updateUserActiveStatus,
    updateMultipleUserActiveStatus,
    getUserProfileImage,
    deleteUserProfileImage
};
