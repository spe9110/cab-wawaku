import express from "express";
import { updateUserProfile, deleteUserProfile } from "../controllers/user_controller.js";
import { getAllUsers, getCurrentUser, getSingleUser } from "../controllers/cacheUsers.js";
import { requiredAuth } from "../config/passport.js";
import { authForRoles } from "../middlewares/authorize.js";


const router = express.Router()

//@route GET /api/v1/users
//@desc This function is used to get all users from the database
//@access PRIVATE
router.get('/', requiredAuth, authForRoles(["admin"]), getAllUsers);

//@route GET /api/v1/users/current
//@desc This function is used to get current users from the database
//@access PRIVATE
router.get('/current', requiredAuth, getCurrentUser);

//@route GET /api/v1/users/:id
//@desc This function is used to get current users from the database
//@access PRIVATE
router.get('/:id', requiredAuth, authForRoles(["admin", "user"]), getSingleUser)

// @route   PUT api/v1/user/update/:id
// @desc    Handle user profile update logic
// @access  Private
router.put('/update/:id', requiredAuth, authForRoles(["admin", "user"]), updateUserProfile);

// @route   DELETE api/v1/user/delete/:id
// @desc    Handle user profile deletion logic
// @access  Private
router.delete('/delete/:id', requiredAuth, authForRoles(["admin"]), deleteUserProfile);

export default router;
