import Joi from "joi";

export const appointmentValidationSchema = Joi.object({
  lawyer: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/) // must be a valid Mongo ObjectId
    .required()
    .messages({
      "string.pattern.base": '"lawyer" must be a valid ObjectId',
      "any.required": '"lawyer" is required'
    }),

  service: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": '"service" must be a valid ObjectId',
      "any.required": '"service" is required'
    }), 
  mode: Joi.string().valid("Cabinet", "Téléphone").default("Cabinet"),
  startTimeUTC: Joi.date().required(),
  status: Joi.string()
    .valid("Pending", "Confirmed", "Canceled", "Completed")
    .default("Pending"),
  notes: Joi.string().max(500).allow("").optional()
});


/*
allow("") allows empty string as valid input
optional() means the field can be omitted entirely

{ "notes": "" }
{ "notes": "Please prepare the contract draft." }
both are valid 
*/ 