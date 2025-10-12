import Joi from "joi";

export const contactMessageSchema = Joi.object({
    gender: Joi.string().valid("man", "woman", "other").default("other"),
    name: Joi.string().trim().required().messages({
        "string.empty": "Name is required"
    }),
    email: Joi.string().email().lowercase().trim().required().messages({
        "string.email": "Email must be valid",
        "string.empty": "Email is required"
    }),
    phone: Joi.string().trim().required().messages({
        "string.empty": "Phone number is required"
    }),
    service: Joi.string().required().messages({
        "string.empty": "Service is required"
    }),
    message: Joi.string().trim().min(50).max(1500).required().messages({
        "string.empty": "Message is required"
    })
})