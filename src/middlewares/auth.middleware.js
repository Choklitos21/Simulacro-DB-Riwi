const jwt = require('jsonwebtoken');
const env = require('../config/env.js');

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ ok: false, message: 'Token no proporcionado' });
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, env.jwt.secret);
        req.user = decoded;

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ ok: false, message: 'Token expirado' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ ok: false, message: 'Token inválido' });
        }
        next(error);
    }
};

export default authMiddleware;
