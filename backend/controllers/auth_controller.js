import User from "../models/user.model.js";
import { userRegisterSchema } from "../validation/userRegister.js";
import { loginUserSchema, resetUserPasswordSchema } from '../validation/userLogin.js';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { secretOrKey, USER_SENDER } from "../Config/keys.js";
import { transporter } from "../Config/transporter.js";
import logger from "../config/logger.js";

//@route POST /api/v1/auth/user/register
//@desc This function is used to create a new user in the database
//@access Public
export const registerUser = async (req, res, next) => {
  try {
    logger.info("User registration attempt", { email: req.body.email });

    const { error } = userRegisterSchema.validate(req.body, { abortEarly: false });
    if (error) {
      logger.warn("Validation failed during registration", { details: error.details });
      return res.status(400).json({ message: error.details[0].message });
    }

    const { name, email, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn("Registration failed: user already exists", { email });
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
    });

    newUser.password = undefined;

    logger.info("New user created successfully", { userId: newUser._id, email: newUser.email });

    const mailOptions = {
      from: { name: "Cabinet Wawaku", address: USER_SENDER },
      to: newUser.email,
      subject: "Bienvenue au Cabinet Wawaku",
      text: `Bienvenue ${newUser.name}, votre compte a été créé avec succès.`,
    };
    await transporter.sendMail(mailOptions);

    logger.info("Welcome email sent", { email: newUser.email });

    res.status(201).json({ message: "User created successfully", user: newUser });
  } catch (error) {
    logger.error("Error during user registration", { error: error.message, stack: error.stack });
    next({ status: 500, error });
  }
};


// @route POST /api/v1/auth/user/login
// @desc This function is used to login a user
// @access Public
export const loginUser = async (req, res, next) => {
  try {
    logger.info("Login attempt", { email: req.body.email });

    const { error } = loginUserSchema.validate(req.body, { abortEarly: false });
    if (error) {
      logger.warn("Login validation failed", { details: error.details });
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn("Login failed: user not found", { email });
      return next({ status: 404, message: "User not found" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      logger.warn("Login failed: invalid password", { email });
      return next({ status: 401, message: "Invalid password" });
    }

    const payload = { id: user._id, name: user.name, email: user.email, role: user.role };
    const accessToken = jwt.sign(payload, secretOrKey, { expiresIn: "1h" });

    res.cookie("AccessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "Strict",
      maxAge: 15 * 60 * 1000,
    });

    logger.info("User logged in successfully", { userId: user._id, email });

    res.status(200).json({
      message: "User logged in successfully",
      token: accessToken,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    logger.error("Error during login", { error: error.message, stack: error.stack });
    next({ status: 500, error });
  }
};


// @route POST /api/v1/auth/user/logout
// @desc This function is used to logout a user
// @access Public
export const logoutUser = async (req, res, next) => {
  try {
    logger.info("Logout request received");

    res.clearCookie("AccessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "Strict",
    });

    logger.info("User logged out successfully");
    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    logger.error("Error during logout", { error: error.message });
    next({ status: 500, error });
  }
};

// @route POST /api/v1/auth/user/sendOtp
// @desc to send verification OTP to the user's email
// @access PUBLIC
export const sendOtpVerification = async (req, res, next) => {
  try {
    const userId = req.user;
    logger.info("OTP verification request sent", { userId });

    // find the user by Id
    const user = await User.findById(userId);
    if (!user) {
      logger.warn("OTP verification failed: user not found", { userId });
      return next({ status: 404, message: "User not found" });
    }

    if (user.isAccountVerified) {
      logger.warn("OTP verification attempt on already verified account", { userId, email: user.email });
      return next({ status: 400, message: "Account is already verified." });
    }

    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    logger.info("Generated new OTP for user", { userId, email: user.email });

    // save the OTP and expiration time to the user's record
    user.verifyOtp = otp;
    user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();
    logger.info("OTP and expiration time saved to user profile", { userId });

    // send the OTP to the user's email
    const mailOptions = {
      from: {
        name: "Cabinet Wawaku",
        address: process.env.USER_SENDER,
      },
      to: user.email,
      subject: "Email Verification OTP",
      text: `Hello ${user.name || ""}, your OTP for email verification is: ${otp} — équipe Cabinet Wawaku`,
    };

    await transporter.sendMail(mailOptions);
    logger.info("Verification OTP email sent successfully", { email: user.email });

    res.status(200).json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    logger.error("Error during OTP verification process", {
      message: error.message,
      stack: error.stack,
      userId: req.user,
    });
    next({ status: 500, message: error.message });
  }
};

// @desc This route is used to verify account for otp
// @route api/v1/auth/users/verify-email
// @private
export const verifyEmail = async (req, res, next) => {
  try {
    const { otp } = req.body;
    logger.info("Email verification request received", { otp });

    if (!otp) {
      logger.warn("OTP is missing from the request body");
      return next({ status: 400, message: "OTP is required" });
    }

    const userId = req.user;
    const user = await User.findById(userId);

    if (!user) {
      logger.warn("Email verification failed: user not found", { userId });
      return next({ status: 404, message: "User not found" });
    }

    // Check if OTP is correct
    if (!user.verifyOtp || user.verifyOtp !== otp) {
      logger.warn("Invalid OTP entered", { userId, email: user.email });
      return next({ status: 400, message: "Invalid OTP" });
    }

    // Check if OTP has expired
    if (!user.verifyOtpExpireAt || user.verifyOtpExpireAt < Date.now()) {
      logger.warn("OTP has expired", { userId, email: user.email });
      return next({ status: 400, message: "OTP has expired" });
    }

    // Mark the account as verified
    user.isAccountVerified = true;
    user.verifyOtp = ""; // Clear the OTP after verification
    user.verifyOtpExpireAt = 0; // Clear the expiration time
    await user.save();

    logger.info("Email verified successfully", { userId, email: user.email });

    return res
      .status(200)
      .json({ success: true, message: "Email verified successfully." });
  } catch (error) {
    logger.error("Error during email verification", {
      message: error.message,
      stack: error.stack,
      userId: req.user,
    });
    next({ status: 500, message: error.message });
  }
};

// @desc send Password Reset OTP to the user's email
// @route api/v1/auth/users/send-reset-password
// @private
export const PasswordResetEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    logger.info("Password reset request received", { email });

    if (!email) {
      logger.warn("Password reset request failed: email is missing");
      return next({ status: 400, message: "Email is required." });
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn("Password reset request failed: user not found", { email });
      return next({ status: 404, message: "User not found." });
    }

    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    logger.info("Generated password reset OTP", { email });

    // Save the OTP and expiration time to the user's document
    user.resetOtp = otp;
    user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();
    logger.info("Password reset OTP and expiry saved", { email });

    // Send the OTP to the user's email
    const mailOptions = {
      from: {
        name: "Spencer Wawaku",
        address: process.env.EMAIL_SENDER,
      },
      to: user.email,
      subject: "Password Reset OTP",
      text: `Hello ${user.name || ""},\n\nYour OTP for password reset is: ${otp}\n\nPlease use this OTP to reset your password.\n\nBest regards,\nMERN Auth Team`,
    };

    await transporter.sendMail(mailOptions);
    logger.info("Password reset OTP email sent successfully", { email });

    return res
      .status(200)
      .json({ success: true, message: "OTP was sent to your email address." });
  } catch (error) {
    logger.error("Error during password reset email process", {
      message: error.message,
      stack: error.stack,
      email: req.body?.email || "unknown",
    });
    next({ status: 500, message: error.message });
  }
};

// @desc This route handle Reset password logic 
// @route api/v1/auth/users/reset-password
// @private
export const resetPassword = async (req, res, next) => {
  try {
    // Validate request body
    const { error } = resetUserPasswordSchema.validate(req.body, { abortEarly: false, allowUnknown: true });
    if( error) {
      logger.warn("Reset password validation failed", { details: error.details });
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      logger.warn("email, otp and new password is missing", { email, otp, newPassword})
      return next({status: 400, message: "Email, OTP, and new password are required."});
    }
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn("user not found", { email })
      return next({status:404, message: "User not found."});
    }
    // Check if OTP is correct
    if (!user.resetOtp || user.resetOtp !== otp) {
      logger.warn("Invalid OTP", {otp})
      return next({status:400, message: "Invalid OTP."});
    }
    // Check if OTP has expired
    if (!user.resetOtpExpireAt || user.resetOtpExpireAt < Date.now()) {
      logger.warn('OTP has expired', { user })
      return next({status:400, message: "OTP has expired."});
    }
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the user's password
    user.password = hashedPassword;
    user.resetOtp = ""; // Clear the OTP after reset
    user.resetOtpExpireAt = 0; // Clear the expiration time

    await user.save();

    logger.info("Password reset successfully", { email: user.email });
    return res.status(200).json({ success: true, message: "Password reset successfully." });
    
  } catch (error) {
    logger.error("Error during password reset", {
      message: error.message,
      stack: error.stack,
      userId: req.user,
    });
    next({ status: 500, message: error.message });
  }
}

// Challenge to complete 
// @desc This route is used to handle Oauth authentication using google
// @route api/v1/auth/users/google-login
// @Public
export const googleAuth = async (req, res, next) => {
  try {
    const { name, email, googleProtocolUrl } = req.body;
    logger.info("")
    const user = await User.findOne({ email });

    if(!user) {
      const token = jwt.sign({ id: user._id}, process.env.JWT_SECRET);
      const { password, ...rest } = user._doc;

      res
        .status(200)
        .cookie("access_token", token, {
          httpOnly: true
        })
        .json(rest)
    } else {
      const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const hashedPassword = bcrypt.hashSync(generatedPassword, 10);

      const newUser = new User({
        username: name.toLowerCase().split("").join('') + Math.round().toString(9).slice(-4),
        email,
        password: hashedPassword,
        profilePicture: generatedPassword
      })
      await newUser.save();

      const token = jwt.sign(
        {
          id: newUser._id
        },
        process.env.JWT_SECRET
      );

      const { password, ...rest } = newUser._doc;
    }

  } catch (error) {
    logger.error("Error during google auth config", {
      message: error.message,
      stack: error.stack,
      userId: req.user,
    });
    next({ status: 500, message: error.message });
  }
}