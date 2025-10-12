import User from "../models/user.model.js";
import Feedback from "../models/feedback.model.js";
import { feedbackValidationSchema } from "../validation/feedback.validation.js";

export const getAllFeedback = async (req, res, next) => {
    try {
        // Extract pagination parameters from query
        let { page = 1, limit = 10 } = req.query;
        
        page = parseInt(page);
        limit = parseInt(limit);

        // Calculate skip value
        const skip = (page - 1) * limit;

        // Query feedback with sorting (newest first) and populate owner name/email
        const feedback = await Feedback.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("owner", "name email");

        // Get total count for pagination metadata
        const totalFeedback = await Feedback.countDocuments();

        // If no results on this page
        if (feedback.length === 0) {
            return next({ status: 404, message: "No feedback found" });
        }

        return res.status(200).json({
            success: true,
            message: "Feedback retrieved successfully",
            page,
            limit,
            totalPages: Math.ceil(totalFeedback / limit),
            totalFeedback,
            count: feedback.length,
            feedback
        });

    } catch (error) {
        next({ status: 500, message: error.message });
    }
};

/*

totalFeedback = 52 (total feedbacks in DB)

feedback.length = 10 (number of feedbacks returned on this page)

*/

export const createFeedback = async (req, res, next) => {
    try {
        // vaidate data - abortEarly: false will stop when the first error find.
        const { error } = feedbackValidationSchema.validate(req.body, {abortEarly: false });
        if(error){
            return next({ status: 400, message: error.details[0].message})
        }
        // Find the logged-in user
        const owner = await User.findById(req.user.id);
        if (!owner) {
            return next({ status: 404, message: "User not found" });
        }

        const { rating, message } = req.body;

        // Check if feedback with same rating & message already exists
        const feedbackExist = await Feedback.findOne({
            owner: owner._id,
            rating,
            message: new RegExp(`^${message}$`, "i") // case-insensitive match
        });

        if (feedbackExist) {
            return next({ status: 400, message: "This feedback is already sent" });
        }

        // Create feedback
        const newFeedback = await Feedback.create({
            owner: owner._id,
            rating,
            message
        });

        return res.status(201).json({
            success: true,
            message: "Feedback is sent successfully",
            feedback: newFeedback
        });

    } catch (error) {
        next({ status: 500, message: error.message });
    }
};