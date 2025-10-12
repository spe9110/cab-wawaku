import ContactMessage from "../models/contact.model.js";
import User from "../models/user.model.js";
import Service from "../models/service.model.js";
import { contactMessageSchema } from "../validation/contactMessage.js";
import multer from "multer";
import fs from 'fs';
import path from "path";
import { transporter } from "../Config/transporter.js";
import { USER_SENDER } from "../Config/keys.js";

// -------------------- Multer Config --------------------
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'piecesUpload';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

export const uploadDocuments = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            req.invalidFiles = req.invalidFiles || [];
            req.invalidFiles.push(file.originalname);
            cb(null, false);
        }
    }
});

// -------------------- Create Message --------------------
export const createMessage = async (req, res, next) => {
    try {
        // Validate body (remove pdfFile because multer handles it)
        const { error } = contactMessageSchema.validate(req.body, { abortEarly: false });
        if (error) return next({ status: 400, message: error.details[0].message });

        // Find logged-in user
        const owner = await User.findById(req.user.id);
        if (!owner) return next({ status: 404, message: "User not found" });

        // Get service ID from body
        const { gender, name, email, phone, message } = req.body;

        // Backend
        const { service: serviceTitle } = req.body;

        // Find service by title instead of ID
        const service = await Service.findOne({ title: serviceTitle });
        if (!service) return next({ status: 404, message: "Selected service not found" });

        // Check email matches owner
        if (email !== owner.email) {
            return next({ status: 409, message: "The email must be the same as the registered one" });
        }

        // Handle uploaded PDF files
        const uploadedFiles = req.files?.map(file => file.path) || [];

        // Warn if any invalid files were uploaded
        let warning = null;
        if (req.invalidFiles && req.invalidFiles.length > 0) {
            warning = 'Some files were rejected (not PDF): ' + req.invalidFiles.join(', ');
        }

        // Check for duplicate message
        const isMessageSent = await ContactMessage.findOne({
            owner: owner._id,
            service: service._id,
            email,
            message: new RegExp(`^${message}$`, "i")
        });
        if (isMessageSent) return next({ status: 400, message: "This message is already sent" });

        // Create new contact message
        const newMessage = await ContactMessage.create({
            owner: owner._id,
            gender,
            name,
            email,
            phone,
            service: service._id,
            message,
            pdfFile: uploadedFiles.length > 0 ? uploadedFiles : " "
        });

        // send welcome email notification
        const mailOptions = {
            from: `"${owner.name}" <USER_SENDER>`,
            replyTo: `${owner.name} <${owner.email}>`, // reply goes to the user
            to: USER_SENDER, // your inbox
            subject: `Vous avez reçu un message de ${owner.name}`,
            text: `
                Nom: ${name}
                Email: ${email}
                Téléphone: ${phone || "Non fourni"}
                Service: ${service?.title}
                Message: ${message}
            `,
            attachments: uploadedFiles.map(file => ({
                filename: path.basename(file),
                path: file
            }))
            };
        // await transporter.sendMail(mailOptions);

        // Send email in background (don't await)
        transporter.sendMail(mailOptions)
            .then(() => console.log("Email sent successfully"))
            .catch(err => console.error("Email sending failed:", err));

        // Send response
        res.status(201).json({
            success: true,
            message: "Message saved & email notification is being sent",
            data: newMessage,
            warning
        });

    } catch (error) {
        next({ status: 500, message: error.message });
    }
};