import logger from "../config/logger.js";
import User from "../models/user.model.js";

//@route GET /api/v1/users
//@desc This function is used to get all users from the database
//@access PRIVATE
const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find({ role: {$ne : "admin"} }).select('-password'); // Exclude password and admin from the response
        // const users = await User.find({})
        
        if (!users || users.length === 0) {
            logger.warn("No users found in database", { requestedBy: req.user?.id || "anonymous" });
            return next({ status: 404, message: "No users found" });
        }

        logger.info("Users fetched successfully", {
            count: users.length,
            requestedBy: req.user?.id || "anonymous",
        });
        const usersTotal = await User.countDocuments();

        res.status(200).json({
            message: "Users fetched successfully",
            count: usersTotal,
            data: users,
        });
    } catch (error) {
        logger.error("Error fetching users", { error });
        next({ status: 500, error });
    }
};

// @route  GET api/users/current
// @desc  Return current user
// @access  Private
const getCurrentUser = async (req, res, next) => {
    try {
        // Assuming req.user is set by authentication middleware
        if (!req.user) {
            logger.warn("Unauthorized attempt to access current user");
            return res.status(401).json({ message: "Unauthorized" });
        }

        logger.info("Fetched current user successfully", { userId: req.user.id });

        // Return the current user's details
        res.status(200).json({
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            isAccountVerified: req.user.isAccountVerified
        });
    } catch (error) {
        logger.error("Error fetching current user", { error });
        next({ status: 500, error });
    }
};

// @route  GET api/v1/user/:id
// @desc  Return user by id
// @access  Private
const getSingleUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    logger.info("Fetching single user", {
      requestedId: id,
      requestedBy: req.user?.id || "anonymous",
    });

    const user = await User.findById(id).select("-password");

    if (!user) {
      logger.warn("User not found", { id });
      return next({ status: 404, message: "User not found" });
    }

    logger.info("User fetched successfully", { id });

    res.status(200).json({
      message: "User fetched successfully",
      user,
    });
  } catch (error) {
    logger.error("Error fetching user by ID", { error, id: req.params.id });
    next({ status: 500, error });
  }
};


// @route   PUT api/v1/user/update/:id
// @desc    Handle user profile update logic
// @access  Private
export const updateUserProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    logger.info("Attempting to update user", {
      requestedId: id,
      requestedBy: req.user?.id || "anonymous",
    });

    const user = await User.findById(id);

    if (!user) {
      logger.warn("User not found", { id });
      return next({ status: 404, message: "User not found" });
    }

    const updatedUser = await User.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    logger.info("User updated successfully", { updatedUser });

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    logger.error("Error updating user by ID", { error: error.message, id: req.params.id });
    next({ status: 500, message: "Error updating user", error });
  }
};


// @route   DELETE api/v1/user/delete/:id
// @desc    Handle user profile deletion logic
// @access  Private
export const deleteUserProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    logger.info("Attempting to delete user", {
      requestedId: id,
      requestedBy: req.user?.id || "anonymous",
    });

    const user = await User.findById(id);

    if (!user) {
      logger.warn("User not found", { id });
      return next({ status: 404, message: "User not found" });
    }

    await User.findByIdAndDelete(id);

    logger.info("User deleted successfully", { id });

    res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting user by ID", { error: error.message, id: req.params.id });
    next({ status: 500, message: "Error deleting user", error });
  }
};
