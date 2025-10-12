import Joi from "joi";

export const userRegisterSchema = Joi.object({
    name: Joi.string().min(2).max(30).required().messages({
        "string.base": "Name must be a string",
        "string.empty": "Name is required",
        "string.min": "Name must be between 2 and 30 characters long",
        "string.max": "Name must be between 2 and 30 characters long",
        "any.required": "Name is required"
    }),
    email: Joi.string().email().trim().required().messages({
        "string.email": "Email must be a valid email address",
        "string.empty": "Email is required",
        "any.required": "Email is required"
    }),
    password: Joi.string()
        .min(8)
        .max(250)
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
        .required()
        .messages({
            "string.pattern.base": "Password must include uppercase, lowercase, number and special character",
            "string.min": "Password must be between 8 and 250 characters long",
            "string.max": "Password must be between 8 and 250 characters long",
            "any.required": "Password is required"
        }),
    password_confirm: Joi.any()
        .valid(Joi.ref('password'))
        .required()
        .messages({
            "any.only": "Password confirmation does not match password",
            "any.required": "Password confirmation is required"
        }),
    role: Joi.string().trim().valid('user', 'admin').default('user').optional(),
});