import Joi from "joi";

export const feedbackValidationSchema = Joi.object({
    rating: Joi.string()
        .valid("Terrible", "Mauvais", "Correct", "Bon", "Excellent")
        .required(),
    
    message: Joi.string().min(50).max(500).required()
});