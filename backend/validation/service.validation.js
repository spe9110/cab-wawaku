import Joi from "joi";

export const serviceValidation = Joi.object({
    title: Joi.string()
        .min(3)
        .max(100)
        .required(),

    slug: Joi.string()
        .min(3)
        .max(100)
        .optional(),

    coverImage: Joi.string()
        .uri()
        .required(),

    shortDescription: Joi.string()
        .max(200)
        .required(),

    description: Joi.array().items(
        Joi.object({
            detail: Joi.string()
                .min(10)
                .max(1000)
                .required(),
            photo: Joi.string()
                .uri()
                .optional()
                .allow('')
        })
    ).min(1).required(),

    category: Joi.string().valid(            
        "Consultation",
        "Avis juridique",
        "Rédaction de contrat",
        "Analyse de contrat",
        "Rédaction de statuts / pactes d'associés",
        "Rédaction de conditions générales",
        "Représentation devant tribunaux civils/commerciaux",
        "Représentation devant juridictions administratives",
        "Représentation en appel",
        "Assistance en garde à vue",
        "Assistance des victimes",
        "Création de société / formalités",
        "Dépôt de marque / brevet / droit d’auteur",
        "Assistance procédures fiscales",
        "Assistance procédures administratives",
        "Négociation amiable, Arbitrage, et Conciliation",
        "Banque et assurances",
        "Foncier et successions",
        "Pro bono et formation"
    ).default("Consultation"),

    price: Joi.number()
        .integer()
        .min(0)
        .required(),

    duration: Joi.number()
        .integer()
        .min(0)
        .default(60)
        .required(),

    isActive: Joi.boolean()
        .default(true),

    tags: Joi.array().items(
        Joi.string().trim().optional()
    ),

    popularity: Joi.number()
        .integer()
        .default(0)
        .optional()
});


export const updateServiceValidation = Joi.object({
    title: Joi.string()
        .min(3)
        .max(100)
        .optional(),

    slug: Joi.string()
        .min(3)
        .max(100)
        .optional(),

    coverImage: Joi.string()
        .uri()
        .optional(),

    shortDescription: Joi.string()
        .max(200)
        .optional(),

    description: Joi.array().items(
        Joi.object({
            detail: Joi.string()
                .min(10)
                .max(1000)
                .optional(),
            photo: Joi.string()
                .uri()
                .optional()
                .allow('')
        })
    ).optional(),

    category: Joi.string().valid(            
        "Consultation",
        "Avis juridique",
        "Rédaction de contrat",
        "Analyse de contrat",
        "Rédaction de statuts / pactes d'associés",
        "Rédaction de conditions générales",
        "Représentation devant tribunaux civils/commerciaux",
        "Représentation devant juridictions administratives",
        "Représentation en appel",
        "Assistance en garde à vue",
        "Assistance des victimes",
        "Création de société / formalités",
        "Dépôt de marque / brevet / droit d’auteur",
        "Assistance procédures fiscales",
        "Assistance procédures administratives",
        "Négociation amiable, Arbitrage, et Conciliation",
        "Banque et assurances",
        "Foncier et successions",
        "Pro bono et formation"
    ).optional(),

    price: Joi.number()
        .integer()
        .min(0)
        .optional(),

    duration: Joi.number()
        .integer()
        .min(0)
        .optional(),

    isActive: Joi.boolean()
        .optional(),

    tags: Joi.array().items(
        Joi.string().trim().optional()
    ),

    popularity: Joi.number()
        .integer()
        .optional()
});