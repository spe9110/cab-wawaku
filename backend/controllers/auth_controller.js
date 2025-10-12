import User from "../models/user.model.js";
import { userRegisterSchema } from "../validation/userRegister.js";
import { loginUserSchema, resetUserPasswordSchema } from '../validation/userLogin.js';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { secretOrKey, USER_SENDER } from "../Config/keys.js";
import { transporter } from "../Config/transporter.js";

//@route POST /api/v1/auth/user/register
//@desc This function is used to create a new user in the database
//@access Public
export const registerUser = async (req, res, next) => {
    try {
        // Validate request body against the schema
        const { error } = userRegisterSchema.validate(req.body, { abortEarly: false });
        if( error) {
            return res.status(400).json({ message: error.details[0].message });
        }
        const { name, email, password, role, password_confirm } = req.body;
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new user
        const newUser = await User.create({
            name,
            email: email,
            password: hashedPassword,
            role: role || 'user'
        })

        // remove password from the response
        newUser.password = undefined;

        // send welcome email notification
        const mailOptions = {
            from:{
                name: "Cabinet Wawaku",
                address: USER_SENDER
            },
            to: newUser.email,
            subject: "Bienvenu au Cabinet Wawaku",
            text: `Bienvenu ${newUser.name}, Vous avez créé avec succès votre compte.` 
        }
        await transporter.sendMail(mailOptions);

        res.status(201).json({
            message: "User created successfully",
            user: newUser
        });
    } catch (error) {
        next({ status: 500, error });
    }
};


// @route POST /api/v1/auth/user/login
// @desc This function is used to login a user
// @access Public
export const loginUser = async (req, res, next) => {
    try {
        // Validate request body
        const { error } = loginUserSchema.validate(req.body, { abortEarly: false });
        if( error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        // Destructure email and password from request body
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if(!user){
            return next({ status: 404, message: "User not found" });
        }

        // Check if password matches
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if(!isPasswordMatch) {
            return next({ status: 401, message: "Invalid password" });
        }
        // create a token for the user
        const payload = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
        // sign the token
        const accessToken = jwt.sign(payload, secretOrKey, { expiresIn: '15m' });

        // cookie to store the token
        res.cookie('AccessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
            sameSite: 'Strict', // Prevent CSRF attacks
            maxAge: 15 * 60 * 1000 // 15 minutes
        })
        // response with user data and token
        res.status(200).json({
            message: "User logged in successfully",
            token: accessToken,
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        })

    } catch (error) {
        next({ status: 500, error });
    }
}


// @route POST /api/v1/auth/user/logout
// @desc This function is used to logout a user
// @access Public
export const logoutUser = async (req, res, next) => {
    try {
        // Clear the cookie
        res.clearCookie('AccessToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'Strict'
        });
        
        res.status(200).json({ message: "User logged out successfully" });
    } catch (error) {
        next({ status: 500, error });
    }
}

// @route to send verification OTP to the user's email
export const sendOtpVerification = async(req, res, next) => {
    try {
        const userId = req.user;
        // find the user by Id
        const user = await User.findById(userId);
        if(!user){
            return next({ status: 404, message: "User not found" });
        }

        if(user.isAccountVerified){
            return next({ status: 400, message: "Account is already verified." });
        }
        // Generate a random 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // save the OTP and expiration time to the user's email
        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        await user.save();

        // send the OTP to the user's email
        const mailOptions = {
            from: {
                name: "Cabinet Wawaku",
                address: process.env.USER_SENDER
            },
            to: user.email,
            subject: "Email Verification OTP",
            text: `Hello ${user.name || ""}, your OTP for email verification is: ${otp} equipe Cabinet Wawaku`
        }

        await transporter.sendMail(mailOptions);
        
        // 201 is used only for creation
        res.status(200).json({ success: true, message: "Verification email sent successfully"})

    } catch (error) {
        next({ status: 500, message: error.message });
    }
}

// @desc This route is used to verify account for otp
// @route api/v1/auth/users
// @private
export const verifyEmail = async (req, res, next) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return next({ status: 404, message: "OTP is required" });
    }

    const userId = req.user; 
    const user = await User.findById(userId);

    if (!user) {
      return next({ status: 404, message: "User not found" });
    }
    
    // Check if OTP is correct
    if (!user.verifyOtp || user.verifyOtp !== otp) {
      return next({ status: 400, message: "Invalid OTP" });
    }

    // Check if OTP has expired
    if (!user.verifyOtpExpireAt || user.verifyOtpExpireAt < Date.now()) {
      return next({ status: 400, message: "OTP has expired" });
    }

    // Mark the account as verified
    user.isAccountVerified = true;
    user.verifyOtp = ""; // Clear the OTP after verification
    user.verifyOtpExpireAt = 0; // Clear the expiration time
    
    await user.save();

    return res.status(200).json({ success: true, message: "Email verified successfully." });

  } catch (error) {
    next({ status: 500, message: error.message });
  }
}

// send Password Reset OTP to the user's email
export const PasswordResetEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return next({status:400, message: "Email is required."});
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return next({status:404, message: "User not found."});
    }
    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save the OTP and expiration time to the user's document
    user.resetOtp = otp;
    user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    await user.save();

    // Send the OTP to the user's email
    const mailOptions = {
      from: {
        name: "Spencer Wawaku",
        address: process.env.EMAIL_SENDER
      },
      to: user.email,
      subject: "Password Reset OTP",
      text: `Hello ${user.name || ""},\n\nYour OTP for password reset is: ${otp}\n\nPlease use this OTP to reset your password.\n\nBest regards,\nMERN Auth Team`,
      // html: PASSWORD_RESET_TEMPLATE
      //   .replace("{{otp}}", otp)
      //   .replace("{{email}}", user.email)
      //   .replace("{{name}}", user.name)
    };
    await transporter.sendMail(mailOptions);
    
    return res.status(200).json({ success: true, message: "OTP was sent to your email address." });
  } catch (error) {
    next(error);
  }
}


export const resetPassword = async (req, res, next) => {
  try {
    // Validate request body
    const { error } = resetUserPasswordSchema.validate(req.body, { abortEarly: false, allowUnknown: true });
    if( error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      return next({status: 400, message: "Email, OTP, and new password are required."});
    }
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return next({status:404, message: "User not found."});
    }
    // Check if OTP is correct
    if (!user.resetOtp || user.resetOtp !== otp) {
      return next({status:400, message: "Invalid OTP."});
    }
    // Check if OTP has expired
    if (!user.resetOtpExpireAt || user.resetOtpExpireAt < Date.now()) {
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
    return res.status(200).json({ success: true, message: "Password reset successfully." });
    
  } catch (error) {
    next(error);
  }
}