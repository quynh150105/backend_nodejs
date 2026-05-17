import { User, OTP } from '../models/index.js';
import { emailService } from '../services/index.js';
import jwt from 'jsonwebtoken';
import { sendError, sendSuccess } from '../utils/response.js';

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

// Generate 4-digit OTP
const generateOTPCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

const authController = {
    // 1. Sign Up
    signup: async (req, res) => {
        try {
            const { username, email, password } = req.body;

            // Check if user already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return sendError(res, { statusCode: 400, message: 'Email is already registered' });
            }

            // Create new user
            const user = await User.create({ username, email, password });
            
            // Generate token
            const token = generateToken(user._id);

            return sendSuccess(res, {
                statusCode: 201,
                message: 'Account created successfully',
                data: {
                    user: { id: user._id, username: user.username, email: user.email },
                    token
                }
            });
        } catch (error) {
            return sendError(res, { message: error.message });
        }
    },

    // 2. Login
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            // Find user
            const user = await User.findOne({ email });
            if (!user) {
                return sendError(res, { statusCode: 401, message: 'Invalid email or password' });
            }

            // Check password
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return sendError(res, { statusCode: 401, message: 'Invalid email or password' });
            }

            // Generate token
            const token = generateToken(user._id);

            return sendSuccess(res, {
                message: 'Logged in successfully',
                data: {
                    user: { id: user._id, username: user.username, email: user.email },
                    token
                }
            });
        } catch (error) {
            return sendError(res, { message: error.message });
        }
    },

    // 3. Forgot Password - Generate & Send OTP
    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body;

            const user = await User.findOne({ email });
            if (!user) {
                return sendError(res, { statusCode: 404, message: 'User not found with this email' });
            }

            // Generate 4-digit OTP
            const otpCode = generateOTPCode();

            // Delete old OTPs for this email if any exist
            await OTP.deleteMany({ email });

            // Save new OTP to database (will expire based on schema setting)
            await OTP.create({
                email,
                otp: otpCode
            });

            // Send Email
            const emailSent = await emailService.sendOTP(email, otpCode);
            
            if (!emailSent) {
                return sendError(res, { message: 'Error sending email. Please try again' });
            }

            return sendSuccess(res, {
                message: 'OTP has been sent to your email'
            });
        } catch (error) {
            return sendError(res, { message: error.message });
        }
    },

    // 4. Verify OTP
    verifyOTP: async (req, res) => {
        try {
            const { email, otp } = req.body;

            const otpRecord = await OTP.findOne({ email, otp });
            
            if (!otpRecord) {
                return sendError(res, { statusCode: 400, message: 'Invalid or expired OTP' });
            }

            // OTP is valid. In a real flow, you might return a temporary token here to be used for the reset step.
            // For simplicity, we just confirm it's valid. The client should proceed to the next screen.
            return sendSuccess(res, {
                message: 'OTP verified successfully. You can now reset your password.'
            });
        } catch (error) {
            return sendError(res, { message: error.message });
        }
    },

    // 5. Reset Password
    resetPassword: async (req, res) => {
        try {
            const { email, otp, newPassword } = req.body;

            // Verify OTP again just to be safe
            const otpRecord = await OTP.findOne({ email, otp });
            if (!otpRecord) {
                return sendError(res, { statusCode: 400, message: 'Invalid or expired OTP' });
            }

            // Find user
            const user = await User.findOne({ email });
            if (!user) {
                return sendError(res, { statusCode: 404, message: 'User not found' });
            }

            // Update password (will be hashed by pre-save hook)
            user.password = newPassword;
            await user.save();

            // Delete used OTP
            await OTP.deleteOne({ _id: otpRecord._id });

            return sendSuccess(res, {
                message: 'Password changed successfully'
            });
        } catch (error) {
            return sendError(res, { message: error.message });
        }
    }
};

export default authController;
