import mongoose, { Schema } from "mongoose";

const contactMessageSchema = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: false, // Keep false in case of anonymous messages
    },
    gender: {
        type: String,
        enum: ['man', 'woman', 'other'],
        default: 'other',
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    phone: {
        type: String,
        required: true,
        trim: true,
    },
    service: {
        type: Schema.Types.ObjectId,
        ref: "Service",
        required: true // Makes sense unless optional by business logic
    },
    message: {
        type: String,
        required: true,
        trim: true,
    },
    pdfFile: {
        type: [String],   // ✅ array of strings
        default: []
    }
}, { timestamps: true });

const ContactMessage = mongoose.model("ContactMessage", contactMessageSchema);

export default ContactMessage;