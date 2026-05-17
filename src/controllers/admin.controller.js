import { User } from '../models/index.js';
import bcrypt from 'bcryptjs';
import { sendError, sendSuccess } from '../utils/response.js';

const adminController = {
    // Get all users
    getAllUsers: async (req, res) => {
        try {
            // Excluding password and role (or you can include role)
            const users = await User.find().select('-password');
            return sendSuccess(res, {
                message: 'Users retrieved successfully',
                data: users,
                meta: { count: users.length }
            });
        } catch (error) {
            return sendError(res, { message: error.message });
        }
    },

    // Get user by ID
    getUserById: async (req, res) => {
        try {
            const user = await User.findById(req.params.id).select('-password');
            if (!user) {
                return sendError(res, { statusCode: 404, message: 'User not found' });
            }
            return sendSuccess(res, { message: 'User retrieved successfully', data: user });
        } catch (error) {
            return sendError(res, { message: error.message });
        }
    },

    // Create a new user (Admin explicitly creates someone)
    createUser: async (req, res) => {
        try {
            const { username, email, password, role } = req.body;

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return sendError(res, { statusCode: 400, message: 'Email is already registered' });
            }

            const user = await User.create({ username, email, password, role: role || 'user' });

            // Don't send back password
            user.password = undefined;

            return sendSuccess(res, {
                statusCode: 201,
                message: 'User created successfully',
                data: user
            });
        } catch (error) {
            return sendError(res, { message: error.message });
        }
    },

    // Update user (Admin updates details)
    updateUser: async (req, res) => {
        try {
            const { username, email, password, role } = req.body;
            const updateFields = {};

            if (username) updateFields.username = username;
            if (email) updateFields.email = email;
            if (role) updateFields.role = role;
            
            if (password) {
                const salt = await bcrypt.genSalt(10);
                updateFields.password = await bcrypt.hash(password, salt);
            }

            const user = await User.findByIdAndUpdate(req.params.id, updateFields, {
                new: true,
                runValidators: true
            }).select('-password');

            if (!user) {
                return sendError(res, { statusCode: 404, message: 'User not found' });
            }

            return sendSuccess(res, { message: 'User updated successfully', data: user });
        } catch (error) {
            return sendError(res, { message: error.message });
        }
    },

    // Delete user
    deleteUser: async (req, res) => {
        try {
            const user = await User.findByIdAndDelete(req.params.id);
            if (!user) {
                return sendError(res, { statusCode: 404, message: 'User not found' });
            }
            return sendSuccess(res, { message: 'User deleted successfully' });
        } catch (error) {
            return sendError(res, { message: error.message });
        }
    }
};

export default adminController;
