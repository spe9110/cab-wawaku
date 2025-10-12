import User from "../models/user.model.js";

//@route GET /api/v1/users
//@desc This function is used to get all users from the database
//@access PRIVATE
export const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find({ role: {$ne : "admin"} }).select('-password'); // Exclude password and admin from the response
        if (!users || users.length === 0) {
            return next({ status: 404, message: "No users found" });
        }
        res.status(200).json({
            message: "Users fetched successfully",
            count: users.length,
            data: users,
        });
    } catch (error) {
        next({ status: 500, error });
        
    }
};

// @route  GET api/users/current
// @desc  Return current user
// @access  Private
export const getCurrentUser = async (req, res, next) => {
    try {
        // Assuming req.user is set by authentication middleware
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        // Return the current user's details
        res.status(200).json({
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            isAccountVerified: req.user.isAccountVerified
        });
    } catch (error) {
        next({ status: 500, error });
    }
};