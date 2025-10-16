import express from "express";
import { registerUser, loginUser, logoutUser, sendOtpVerification, verifyEmail, PasswordResetEmail, resetPassword } from "../controllers/auth_controller.js";
import { requiredAuth } from "../config/passport.js";

const router = express.Router()

//@route POST /api/v1/auth/user/register
//@desc This function is used to create a new user in the database
//@access Public
router.post('/register', registerUser);

// @route POST /api/v1/auth/user/login
// @desc This function is used to login a user
// @access Public
router.post('/login', loginUser);

// @route POST /api/v1/auth/user/logout
// @desc This function is used to logout a user
// @access Public
router.post('/logout', logoutUser);

// @route POST /api/v1/auth/user/sendOtp
// @desc to send verification OTP to the user's email
// @access PUBLIC
router.post('/send-otp-verify', requiredAuth, sendOtpVerification);

// @desc This route is used to verify account for otp
// @route api/v1/auth/users
// @private
router.post('/verify-email', requiredAuth, verifyEmail)

// @desc This route is used to handle send Password Reset OTP to the user's email
// @route api/v1/auth/users/password-reset
// @private
router.post('/send-reset-password', requiredAuth, PasswordResetEmail);

// @desc This route handle Reset password logic 
// @route api/v1/auth/users/reset-password
// @private
router.post('/reset-password', requiredAuth, resetPassword);

export default router;