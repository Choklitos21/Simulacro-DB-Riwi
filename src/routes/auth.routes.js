import { Router } from "express";
import authController from '../controllers/auth.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = Router();

// Públicas
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protegidas
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.me);

export default router;
