import express from 'express';
const router = express.Router();
import { authController } from '../controllers/index.js';
import { authMiddleware } from '../middlewares/index.js';
import { sendSuccess } from '../utils/response.js';

// Public routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-otp', authController.verifyOTP);
router.post('/reset-password', authController.resetPassword);

// Protected routes example
router.get('/me', authMiddleware, (req, res) => {
    return sendSuccess(res, {
        message: 'You have accessed a protected route',
        data: {
            userId: req.user.id
        }
    });
});

export default router;
