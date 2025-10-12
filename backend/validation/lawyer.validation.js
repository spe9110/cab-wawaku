import Joi from "joi";

export const lawyerValidationSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required()
        .messages({
            "string.base": "Name must be a string",
            "string.empty": "Name is required",
            "string.min": "Name must be at least 2 characters",
            "string.max": "Name must be less than or equal to 100 characters"
        }),
    email: Joi.string()
        .trim()
        .email()
        .required()
        .messages({
            "string.email": "Email must be a valid email address",
            "any.required": "Email is required"
        }),

    photo: Joi.string()
        .trim()
        .pattern(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i)
        .required()
        .messages({
            "string.pattern.base": "Photo must be a valid image URL (jpg, jpeg, png, gif, webp)",
            "any.required": "Photo is required"
        }),

    number_phone: Joi.string()
        .trim()
        .pattern(/^\+?[0-9\s\-]{7,20}$/)
        .required()
        .messages({
            "string.pattern.base": "Phone number must be valid (7–20 digits, may include spaces or '-')",
            "any.required": "Phone number is required"
        }),

    job_details: Joi.object({
        profession: Joi.string().trim().max(100).allow(""),
        number_ONA: Joi.string().trim().allow(""),
        barreau: Joi.string().trim().max(100).allow(""),
        experience_years: Joi.number().integer().optional(),
        specialization: Joi.string().trim().max(100).allow("")
    }).optional(),
    location: Joi.array().items(
        Joi.object({
            label1: Joi.string().required(),
            label2: Joi.string().allow(""),
            city: Joi.string().required(),
            postalCode: Joi.string().required(),
            country: Joi.string().required(),
        })
    ).optional(),
    social_media: Joi.array().items(
        Joi.object({
            name: Joi.string()
                .valid('LinkedIn', 'Facebook', 'Twitter', 'Instagram', 'YouTube', 'Website')
                .required()
                .messages({
                    "any.only": "Social media name must be one of LinkedIn, Facebook, Twitter, Instagram, YouTube, Website"
                }),
            url: Joi.string()
                .uri()
                .required()
                .messages({
                    "string.uri": "Social media URL must be a valid link"
                })
        })
    ).optional(),

    workDays: Joi.array()
        .items(
            Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
        )
        .default(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])
        .messages({
            "any.only": "Work day must be a valid weekday"
        }),

    holidays: Joi.array()
        .items(
            Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).messages({
                "string.pattern.base": "Holiday date must be in YYYY-MM-DD format"
            })
        )
        .default([]),

    workHours: Joi.object({
        start: Joi.string()
            .pattern(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
            .default("09:00")
            .messages({
                "string.pattern.base": "Start time must be in HH:MM format"
            }),
        end: Joi.string()
            .pattern(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
            .default("19:00")
            .messages({
                "string.pattern.base": "End time must be in HH:MM format"
            })
    }).optional(),
});


export const updateLawyerValidationSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .messages({
            "string.base": "Name must be a string",
            "string.min": "Name must be at least 2 characters",
            "string.max": "Name must be less than or equal to 100 characters"
        }),

    email: Joi.string()
        .trim()
        .email()
        .messages({
            "string.email": "Email must be a valid email address"
        }),

    photo: Joi.string()
        .trim()
        .pattern(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i)
        .messages({
            "string.pattern.base": "Photo must be a valid image URL (jpg, jpeg, png, gif, webp)"
        }),

    number_phone: Joi.string()
        .trim()
        .pattern(/^\+?[0-9\s\-]{7,20}$/)
        .messages({
            "string.pattern.base": "Phone number must be valid (7–20 digits, may include spaces or '-')"
        }),

    job_details: Joi.object({
        profession: Joi.string().trim().max(100).allow(""),
        number_ONA: Joi.string().trim().allow(""),
        barreau: Joi.string().trim().max(100).allow(""),
        experience_years: Joi.number().integer(),
        specialization: Joi.string().trim().max(100).allow("")
    }),
    social_media: Joi.array().items(
        Joi.object({
            name: Joi.string()
                .valid('LinkedIn', 'Facebook', 'Twitter', 'Instagram', 'YouTube', 'Website')
                .messages({
                    "any.only": "Social media name must be one of LinkedIn, Facebook, Twitter, Instagram, YouTube, Website"
                }),
            url: Joi.string()
                .uri()
                .messages({
                    "string.uri": "Social media URL must be a valid link"
                })
        })
    ),

    workDays: Joi.array().items(
        Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')
    ).messages({
        "any.only": "Work day must be a valid weekday"
    }),

    holidays: Joi.array().items(
        Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).messages({
            "string.pattern.base": "Holiday date must be in YYYY-MM-DD format"
        })
    ),

    workHours: Joi.object({
        start: Joi.string()
            .pattern(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
            .messages({
                "string.pattern.base": "Start time must be in HH:MM format"
            }),
        end: Joi.string()
            .pattern(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
            .messages({
                "string.pattern.base": "End time must be in HH:MM format"
            })
    })
});