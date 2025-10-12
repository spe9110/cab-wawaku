import Service from "../models/service.model.js";
import { serviceValidation, updateServiceValidation } from "../validation/service.validation.js";
import User from "../models/user.model.js";

export const getAllServices = async (req, res, next) => {
    try {

        // Query feedback with sorting (newest first) and populate owner name/email
        const service = await Service.find({})
            // .sort({ createdAt: -1 })
            .sort({ createdAt: 1 })

        // Get total count for pagination metadata
        const totalService = await Service.countDocuments();

        // If no results on this page
        if(service.length === 0){
            return next({ status: 404, message: "No service found" });
        }

        return res.status(200).json({ 
            success: true, 
            message: "Services retrieve successfully",
            totalService,
            service 
        })
    } catch (error) {
        res.status(500).json({message:error.message})
    }
}

export const getSixServices = async (req, res, next) => {
    try {
        // Extract pagination parameters from query and limit of 6 items
        let { page = 1, limit = 6 } = req.query;
        
        page = parseInt(page);
        limit = parseInt(limit);

        // Calculate skip value
        const skip = (page - 1) * limit;

        // Query feedback with sorting (newest first) and populate owner name/email
        const service = await Service.find({})
            // .sort({ createdAt: -1 })
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limit)

        // Get total count for pagination metadata
        const totalService = await Service.countDocuments();

        // If no results on this page
        if(service.length === 0){
            return next({ status: 404, message: "No service found" });
        }

        return res.status(200).json({ 
            success: true, 
            message: "Services retrieve successfully",
            page,
            limit,
            totalPages: Math.ceil(totalService / limit),
            totalService, 
            count: service.length, 
            service 
        })
    } catch (error) {
        next({ status: 500, message: error.message });
    }
}

export const createService = async (req, res, next) => {
    try {
        // Data validation
        const { error } = serviceValidation.validate(req.body, { abortEarly: false });
        if(error){
            return next({ status: 400, message: error.details[0].message})
        }

        // Find logged-in user (req.user injected by auth middleware)
        const owner = await User.findById(req.user.id);
        if (!owner) {
            return next({ status: 404, message: "User not found" });
        }

        // Destructure validated values
        const {
            title,
            slug,
            coverImage,
            shortDescription,
            description,
            category,
            price,
            duration,
            isActive,
            tags
        } = req.body;

        // Ensure uniqueness of service by title
        const isServiceExist = await Service.findOne({ title });
        if (isServiceExist) {
            return next({ status: 400, message: "This service already exists" });
        }

        // Auto-generate service order - Count all services to set the order value
        const countService = await Service.countDocuments();


        // Create new service - add createdBy from authenticated user
        const newService = await Service.create({
            title,
            slug,   // optional
            order: String(countService + 1).padStart(2, "0"),
            coverImage,
            shortDescription,
            description,    // Joi ensures it's an array of {detail, photo}
            category: category || "Consultation", 
            price,
            duration: duration || 30,
            isActive,
            tags,
            popularity: 0,
            createdBy: owner._id   // store reference instead of whole object
        });

        return res.status(201).json({
            success: true,
            message: "Service created successfully",
            service: newService
        });
    } catch (error) {
        next({ status: 500, message: error.message });
    }
}

export const updateService = async (req, res, next) => {
    try {
        // Data validation
        const { error } = updateServiceValidation.validate(req.body, { abortEarly: false });
        if(error){
            return next({ status: 400, message: error.details[0].message });
        }

        // Find logged-in user (req.user injected by auth middleware)
        const owner = await User.findById(req.user.id);
        if (!owner) {
            return next({ status: 404, message: "User not found" });
        }

        const { id } = req.params;

        // Find service
        const service = await Service.findById(id);
        if (!service) {
            return next({ status: 400, message: "This service is not found" });
        }

        // If description exists in req.body, push each item into the existing array
        if (req.body.description && Array.isArray(req.body.description)) {
            for (const desc of req.body.description) {
                service.description.push(desc);
            }
        }

        // Update other fields
        Object.keys(req.body).forEach(key => {
            if (key !== "description") {
                service[key] = req.body[key];
            }
        });

        service.owner = owner._id;

        await service.save();

        return res.status(200).json({
            success: true,
            message: "Service updated successfully",
            service
        });

    } catch (error) {
        next({ status: 500, message: error.message });
    }
};