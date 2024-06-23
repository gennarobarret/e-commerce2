"use strict";
const Joi = require('joi');


// User validation function
const validateUser = (data, options = {}) => {
    const schema = Joi.object({
        // _id: Joi.string()
        //     .messages({
        //         'string.base': '_id must be a string.'
        //     })
        //     .when('$idRequired', { is: true, then: Joi.required(), otherwise: Joi.optional() })
        //     .messages({
        //         'any.required': '_id field is required.'
        //     }),
        userName: Joi.string()
            .alphanum()
            .min(5)
            .max(20)
            .when('$userNameRequired', { is: true, then: Joi.required(), otherwise: Joi.forbidden() })
            .messages({
                'string.alphanum': 'Username must only contain alphanumeric characters.',
                'string.min': 'Username must have at least 5 characters.',
                'string.max': 'Username must not exceed 20 characters.',
                'any.required': 'Username is a required field.',
                'any.forbidden': 'Username cannot be updated.'
            }),

        firstName: Joi.string().required().trim().messages({
            'any.required': 'First name is a required field.'
        }),
        lastName: Joi.string().required().trim().messages({
            'any.required': 'Last name is a required field.'
        }),
        organizationName: Joi.string().min(3).max(30).trim().messages({
            'string.min': 'Organization name must have at least 3 characters.',
            'string.max': 'Organization name must not exceed 30 characters.'
        }),
        countryAddress: Joi.string().trim(),
        stateAddress: Joi.string().trim(),
        emailAddress: Joi.string()
            .email()
            .lowercase()
            .trim()
            .when('$emailAddressRequired', { is: true, then: Joi.required(), otherwise: Joi.forbidden() })
            .messages({
                'string.email': 'Email address is not valid.',
                'any.required': 'Email address is a required field.',
                'any.forbidden': 'Email address cannot be updated.'
            }),
        authMethod: Joi.string()
            .valid('local', 'google', 'github')
            .default('local')
            .optional()
            .messages({
                'any.required': 'Authentication method is a required field.',
                'any.only': 'Authentication method must be one of the following: local, google, github.'
            }),
        role: Joi.array()
            .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
            .when('$roleRequired', { is: true, then: Joi.required(), otherwise: Joi.forbidden() })
            .messages({
                'string.pattern.base': 'Each role must be a valid ObjectId.',
                'array.base': 'Role must be an array of ObjectIds.',
                'any.required': 'Role is a required field.'
            }),
        verification: Joi.string()
            .valid('verified', 'notVerified')
            .default('notVerified')
            .optional()
            .messages({
                'any.required': 'Verification field is required.',
                'any.only': 'Verification must be either verified or notVerified.'
            }),
        password: Joi.string()
            .pattern(new RegExp('^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$'))
            .messages({
                'string.pattern.base': 'Password must have at least 8 characters, including numbers, uppercase, lowercase letters, and special characters.'
            })
            .when('$passwordRequired', { is: true, then: Joi.required(), otherwise: Joi.optional() })
            .when('$authMethod', {
                is: 'local',
                then: Joi.when('$verification', {
                    is: 'verified',
                    then: Joi.required(),
                    otherwise: Joi.optional()
                }),
                otherwise: Joi.optional()
            }),
        phoneNumber: Joi.string().trim(),
        birthday: Joi.date().messages({
            'date.base': 'The birth date format is not valid.'
        }),
        identification: Joi.string().trim(),
        additionalInfo: Joi.string().trim(),
        profileImage: Joi.string()
            .trim()
            .allow(null)
            .default(null),
        isActive: Joi.boolean().optional().messages({
            'any.required': 'isActive field is required.'
        }),
        emailNotifications: Joi.object({
            accountChanges: Joi.boolean().default(false),
            groupChanges: Joi.boolean().default(false),
            productUpdates: Joi.boolean().default(false),
            newProducts: Joi.boolean().default(false),
            marketingOffers: Joi.boolean().default(false),
            securityAlerts: Joi.boolean().default(false)
        }).optional(),
        loginAttempts: Joi.number(),
        lockUntil: Joi.number()
    }).options({ abortEarly: false });

    return schema.validate(data, {
        context: {
            isNewUser: options.isNewUser ?? false,
            userNameRequired: options.userNameRequired ?? false,
            emailAddressRequired: options.emailAddressRequired ?? false,
            roleRequired: options.roleRequired ?? false,
            passwordRequired: options.passwordRequired ?? false
        }
    });
};

const validateUserForLogin = (userData) => {
    return validateUser(userData, { passwordRequired: true, idRequired: false });
};

const validateLogin = (data) => {
    const schema = Joi.object({
        userName: Joi.string()
            .alphanum()
            .min(1)
            .max(20)
            .trim()
            .required(),
        password: Joi.string()
            .trim()
            .required()
    });

    return schema.validate(data, { abortEarly: false });
};

const validateResetPassword = (data) => {
    const schema = Joi.object({
        token: Joi.string().required(),
        newPassword: Joi.string()
            .pattern(new RegExp('^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$'))
            .messages({
                'string.pattern.base': 'Password must be at least 8 characters, including numbers, uppercase, lowercase, and special characters.'
            })
            .required()
    }).options({ allowUnknown: false });

    return schema.validate(data, { abortEarly: false });
};

const validateRole = (data) => {
    const schema = Joi.object({
        name: Joi.string().required().messages({
            'any.required': 'The name is a required field.',
            'string.base': 'The name must be a string.'
        }),
        permissions: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).required().messages({
            'array.base': 'Permissions must be an array of ObjectIds.',
            'string.pattern.base': 'Each permission must be a valid ObjectId.'
        })
    }).options({ abortEarly: false });

    return schema.validate(data);
};

const validatePermission = (data) => {
    const schema = Joi.object({
        name: Joi.string().required().messages({
            'any.required': 'The name is a required field.',
            'string.base': 'The name must be a string.'
        }),
        action: Joi.string().required().messages({
            'any.required': 'The action is a required field.',
            'string.base': 'The action must be a string.'
        }),
        resource: Joi.string().required().messages({
            'any.required': 'The resource is a required field.',
            'string.base': 'The resource must be a string.'
        })
    }).options({ abortEarly: false });

    return schema.validate(data);
};

const auditLogSchema = (data) => {
    const schema = Joi.object({
        action: Joi.string().required(),
        by: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
        targetType: Joi.string().required(),
        targetDoc: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
        details: Joi.object(),
        alertLevel: Joi.string().valid('Critical', 'High', 'Medium', 'Low').required(),
        createdAt: Joi.date().default(() => new Date(), 'current date')
    }).options({ abortEarly: false });
    return schema.validate(data);
};

// Validación de alertas
const validateAlert = (data) => {
    const schema = Joi.object({
        type: Joi.string().valid('info', 'warning', 'danger', 'success').required().messages({
            'any.only': 'Type must be one of info, warning, danger, or success.',
            'any.required': 'Type is a required field.'
        }),
        message: Joi.string().trim().min(1).max(1000).required().messages({
            'string.base': 'Message must be a string.',
            'string.min': 'Message must have at least 1 character.',
            'string.max': 'Message must not exceed 1000 characters.',
            'any.required': 'Message is a required field.'
        }),
        sender: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
            'string.pattern.base': 'Sender must be a valid ObjectId.',
            'any.required': 'Sender is a required field.'
        }),
        recipients: Joi.array().items(
            Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
                'string.pattern.base': 'Each recipient must be a valid ObjectId.',
                'any.required': 'Recipients are required fields.'
            })
        ).required().messages({
            'array.base': 'Recipients must be an array of ObjectIds.',
            'any.required': 'Recipients is a required field.'
        }),
        isSeen: Joi.boolean().default(false),
        seenBy: Joi.array().items(Joi.object({
            userId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
                'string.pattern.base': 'UserId must be a valid ObjectId.',
                'any.required': 'UserId is a required field.'
            }),
            seenAt: Joi.date().default(() => new Date())
        })).optional(),
        timestamp: Joi.date().default(() => new Date())
    }).options({ abortEarly: false });

    return schema.validate(data);
};

// Validación de mensajes
const validateMessage = (data) => {
    const schema = Joi.object({
        content: Joi.string().trim().min(1).max(2000).required().messages({
            'string.base': 'Content must be a string.',
            'string.min': 'Content must have at least 1 character.',
            'string.max': 'Content must not exceed 2000 characters.',
            'any.required': 'Content is a required field.'
        }),
        sender: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
            'string.pattern.base': 'Sender must be a valid ObjectId.',
            'any.required': 'Sender is a required field.'
        }),
        recipients: Joi.array().items(
            Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
                'string.pattern.base': 'Each recipient must be a valid ObjectId.',
                'any.required': 'Recipients are required fields.'
            })
        ).required().messages({
            'array.base': 'Recipients must be an array of ObjectIds.',
            'any.required': 'Recipients is a required field.'
        }),
        isRead: Joi.boolean().default(false),
        readBy: Joi.array().items(Joi.object({
            userId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
                'string.pattern.base': 'UserId must be a valid ObjectId.',
                'any.required': 'UserId is a required field.'
            }),
            readAt: Joi.date().default(() => new Date())
        })).optional(),
        attachments: Joi.array().items(Joi.object({
            fileName: Joi.string().optional(),
            filePath: Joi.string().uri().optional()
        })).optional(),
        importance: Joi.string().valid('low', 'normal', 'high').default('normal').messages({
            'any.only': 'Importance must be one of low, normal, or high.'
        }),
        timestamp: Joi.date().default(() => new Date())
    }).options({ abortEarly: false });

    return schema.validate(data);
};

// Exportar todas las funciones de validación
module.exports = {
    validateUser,
    validateLogin,
    validateUserForLogin,
    validateResetPassword,
    validateRole,
    validatePermission,
    auditLogSchema,
    validateAlert,
    validateMessage
};

