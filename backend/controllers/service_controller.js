import Service from "../models/service.model.js";
import { serviceValidation, updateServiceValidation } from "../validation/service.validation.js";
import User from "../models/user.model.js";
import logger from "../config/logger.js";

const getAllServices = async (req, res, next) => {
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

const getSixServices = async (req, res, next) => {
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

// @desc Create new service
// @route POST /api/v1/services
// @access Private
export const createService = async (req, res, next) => {
  try {
    logger.info("Creating new service", { requestedBy: req.user?.id || "anonymous" });

    // Data validation
    const { error } = serviceValidation.validate(req.body, { abortEarly: false });
    if (error) {
      logger.warn("Service validation failed", { details: error.details });
      return next({ status: 400, message: error.details[0].message });
    }

    // Find logged-in user
    const owner = await User.findById(req.user.id);
    if (!owner) {
      logger.warn("User not found while creating service", { userId: req.user.id });
      return next({ status: 404, message: "User not found" });
    }

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
      tags,
    } = req.body;

    // Ensure uniqueness of service
    const isServiceExist = await Service.findOne({ title });
    if (isServiceExist) {
      logger.warn("Duplicate service title detected", { title });
      return next({ status: 400, message: "This service already exists" });
    }

    // Count total services for ordering
    const countService = await Service.countDocuments();

    // Create new service
    const newService = await Service.create({
        title,
        slug,
        order: String(countService + 1).padStart(2, "0"),
        coverImage,
        shortDescription,
        description,
        category: category || "Consultation",
        price,
        duration: duration || 30,
        isActive,
        tags,
        popularity: 0,
        createdBy: owner._id,
    });

    logger.info("Service created successfully", {
      serviceId: newService._id,
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Service created successfully",
      service: newService,
    });
  } catch (error) {
    logger.error("Error creating service", { error: error.message });
    next({ status: 500, message: error.message });
  }
};

// @desc Update service by ID
// @route PUT /api/v1/services/:id
// @access Private
export const updateService = async (req, res, next) => {
  try {
    logger.info("Updating service", {
      requestedBy: req.user?.id || "anonymous",
      serviceId: req.params.id,
    });

    // Data validation
    const { error } = updateServiceValidation.validate(req.body, { abortEarly: false });
    if (error) {
      logger.warn("Service update validation failed", { details: error.details });
      return next({ status: 400, message: error.details[0].message });
    }

    // Verify owner
    const owner = await User.findById(req.user.id);
    if (!owner) {
      logger.warn("User not found while updating service", { userId: req.user.id });
      return next({ status: 404, message: "User not found" });
    }

    const { id } = req.params;
    const service = await Service.findById(id);

    if (!service) {
      logger.warn("Service not found", { serviceId: id });
      return next({ status: 400, message: "This service is not found" });
    }

    // Update description array
    if (req.body.description && Array.isArray(req.body.description)) {
      for (const desc of req.body.description) {
        service.description.push(desc);
      }
    }

    // Update other fields
    Object.keys(req.body).forEach((key) => {
      if (key !== "description") {
        service[key] = req.body[key];
      }
    });

    service.owner = owner._id;

    await service.save();

    logger.info("Service updated successfully", { serviceId: id, updatedBy: req.user.id });

    return res.status(200).json({
      success: true,
      message: "Service updated successfully",
      service,
    });
  } catch (error) {
    logger.error("Error updating service", { error: error.message, serviceId: req.params.id });
    next({ status: 500, message: error.message });
  }
};

// @desc Delete service by ID
// @route DELETE /api/v1/services/:id
// @access Private
export const deleteService = async (req, res, next) => {
  try {
    logger.info("Deleting service", {
      requestedBy: req.user?.id || "anonymous",
      serviceId: req.params.id,
    });

    // Data validation
    const { error } = updateServiceValidation.validate(req.body, { abortEarly: false });
    if (error) {
      logger.warn("Service delete validation failed", { details: error.details });
      return next({ status: 400, message: error.details[0].message });
    }

    // Verify owner
    const owner = await User.findById(req.user.id);
    if (!owner) {
      logger.warn("User not found while deleting service", { userId: req.user.id });
      return next({ status: 404, message: "User not found" });
    }

    const { id } = req.params;
    const service = await Service.findById(id);

    if (!service) {
      logger.warn("Service not found for deletion", { serviceId: id });
      return next({ status: 400, message: "This service is not found" });
    }

    // Delete service
    await Service.findByIdAndDelete(id);

    logger.info("Service deleted successfully", { serviceId: id, deletedBy: req.user.id });

    return res.status(200).json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting service", { error: error.message, serviceId: req.params.id });
    next({ status: 500, message: error.message });
  }
};



/*
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

export const deleteService = async (req, res, next) => {
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
*/