import express from 'express';
import {
    registerUser,
    loginUser,
    logoutUser,
    getUserProfile,
    protectedTest
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', protect, getUserProfile);
router.get('/protected-test', protect, protectedTest);

export default router;
