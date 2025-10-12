import Joi from "joi";

export const loginUserSchema = Joi.object({
    email: Joi.string().email().lowercase().trim().required().messages({
        "string.email": "Email must be a valid email address",
        "string.empty": "Email is required",
    }),
    password: Joi.string()
        .min(8)
        .max(255)
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
        .required()
        .messages({
            'string.empty': 'Password is required',
            'string.min': 'Password must be at least 8 characters long',
            'string.max': 'Password cannot be more than 255 characters long',
            'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        }),
})

export const resetUserPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
    newPassword: Joi.string()
        .min(8)
        .max(255)
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
        .required()
        .messages({
            'string.empty': 'Password is required',
            'string.min': 'Password must be at least 8 characters long',
            'string.max': 'Password cannot be more than 255 characters long',
            'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        })
})