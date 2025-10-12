import Lawyer from "../models/lawyer.model.js";
import User from "../models/user.model.js";
import { lawyerValidationSchema, updateLawyerValidationSchema } from "../validation/lawyer.validation.js";

// @desc This route is used to get all lawyer data
// @route api/v1/lawyer/
// PUBLIC
export const getAllLawyers = async (req, res, next) => {
    try {
        const lawyers = await Lawyer.find({});
        if(lawyers.length === 0) {
            return next({ status: 404, message: "No lawyer found" });
        }
        const lawyerCount = await Lawyer.countDocuments();

        return res.status(200).json({
            success: true,
            message: "lawyers retrieved successfully",
            count: lawyerCount,
            lawyers
        })
    } catch (error) {
        next({status: 500, message: error.message})
    }
}

// @desc This route is used to get a single lawyer data
// @route api/v1/lawyer/:id
// PUBLIC
export const getSingleLawyer = async (req, res, next) => {
    try {
        const { id } = req.params;
        const lawyer = await Lawyer.findById(id);
        if(!lawyer) {
            return next({ status: 404, message: "No lawyer profile found" });
        }
        return res.status(200).json({
            success: true,
            message: "lawyer retrieved successfully",
            lawyer
        })
    } catch (error) {
        next({status: 500, message: error.message})
    }
}


// @desc This route is used to create a lawyer data
// @route api/v1/lawyer/create
// PRIVATE
export const createLawyerProfile = async (req, res, next) => {
    try {
        const { error } = lawyerValidationSchema.validate(req.body, { abortEarly: false })
        if(error){
            return next({ status: 400, message: error.details[0].message})
        }
        // Find the logged-in admin user
        const admin = await User.findById(req.user.id);
        if (!admin) {
            return next({ status: 404, message: "Admin user not found" });
        }

        const { name, email, photo, number_phone, job_details, location, social_media, workDays, workHours } = req.body;

        // check if lawyer exist
        const isLawyerExist = await Lawyer.findOne({email});
        if(isLawyerExist){
            return next({ status: 400, message: "This lawyer profile already exists" });
        }

        // add new profile to the data base
        const newLawyer = await Lawyer.create({
            name: name, 
            email: email, 
            photo: photo, 
            number_phone: number_phone, 
            job_details,
            location, 
            social_media, 
            workDays, 
            workHours,
            createdBy: admin._id 
        })

        // response
        return res.status(201).json({ 
            success: true, 
            message: "A new lawyer is successfully created", 
            newLawyer 
        });

    } catch (error) {
        next({status: 500, message: error.message})
    }
}

// @desc This route is used to update a lawyer data
// @route PUT api/v1/lawyer/:id
// PRIVATE
export const updateLawyerProfile = async (req, res, next) => {
    try {
        const { error } = updateLawyerValidationSchema.validate(req.body, { abortEarly: false })
        if(error){
            return next({ status: 400, message: error.details[0].message})
        }
        // Check if user exists
        const owner = await User.findById(req.user.id);
        if (!owner) {
            return next({ status: 404, message: "User not found" });
        }

        const { id } = req.params;

        // Check if lawyer exists
        const isLawyerExist = await Lawyer.findById(id);
        if (!isLawyerExist) {
            return next({ status: 404, message: "No lawyer profile found" });
        }

        // Update lawyer
        const updateLawyer = await Lawyer.findByIdAndUpdate(
            id,
            {   ...req.body,
                lastModifiedBy: owner
            },
            { new: true, runValidators: true }
        );

        return res.status(200).json({ 
            success: true, 
            message: "Lawyer profile successfully updated", 
            lawyer: updateLawyer 
        });

    } catch (error) {
        next({status: 500, message: error.message})
    }
}