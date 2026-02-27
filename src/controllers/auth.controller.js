import authService from '../services/auth.service.js';

const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const user = await authService.register({ name, email, password });
        res.status(201).json({ ok: true, data: user });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const { user, token } = await authService.login({ email, password });
        res.status(200).json({ ok: true, data: { user, token } });
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        res.status(200).json({ ok: true, message: 'Sesión cerrada' });
    } catch (error) {
        next(error);
    }
};

const me = async (req, res, next) => {
    try {
        // req.user lo agrega el authMiddleware
        const user = await authService.getById(req.user.id);
        res.status(200).json({ ok: true, data: user });
    } catch (error) {
        next(error);
    }
};

export default {
    register,
    login,
    logout,
    me
};
