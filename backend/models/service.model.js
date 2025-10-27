import mongoose, { Schema } from "mongoose";

const serviceSchema = new Schema({
    title: {
        type: String,
        required: true,         
        minlength: 3,           
        maxlength: 100,
        trim: true              
    },
    slug: {
        type: String,
        unique: true,
        trim: true
    },
    order: {
        type: String,
        default: 0 
    },
    coverImage: {  
        type: String,
        trim: true,
        required: true
    },
    shortDescription: {
        type: String,
        required: true,          
        maxlength: 200,
    },
    description: [
        {
            detail: {
                type: String,
                required: true,
                trim: true,
                minlength: 10,    
                maxlength: 1000, 
            },
            photo: {
                type: String,
                trim: true,
            },
        }
    ],
    category: {
        type: String,
        enum: [
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
        ],
        default: "Consultation"
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    duration: {
        type: Number, // en minutes
        required: true,
        default: 30
    },
    isActive: {
        type: Boolean,
        default: false
    },
    lawyers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lawyer"
    }],
    tags: [{
        type: String,
        trim: true
    }],
    popularity: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, {
    timestamps: true
});

const Service = mongoose.model("Service", serviceSchema);

export default Service;

/*

https://www.alexia.fr/activite-3505/avocat-en-droit-des-etrangers.htm?utm_source=google&utm_medium=CPC&utm_campaign=penal&t=c&gad_source=1&gad_campaignid=22526019779&gbraid=0AAAAADiDQB4EJWGruKgymbUs9v99XdWN1&gclid=CjwKCAjw0sfHBhB6EiwAQtv5qQQkxSpmJx4FZNo_hbJBVmUUu579I_FJ6E8-5_itYE-sbm-iySIyFxoC5d8QAvD_BwE

https://www.dolivet-avocat.com/premiere-rencontre


*/ 