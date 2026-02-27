const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/postgres.js');
const env = require('../config/env.js');

const register = async ({ name, email, password }) => {
    const { rows } = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
    );
    if (rows.length > 0) {
        throw { status: 400, message: 'El email ya está registrado' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { rows: [user] } = await pool.query(
        'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
        [name, email, hashedPassword]
    );

    return user;
};

const login = async ({ email, password }) => {
    const { rows } = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
    );
    const user = rows[0];

    if (!user) {
        throw { status: 401, message: 'Credenciales inválidas' };
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        throw { status: 401, message: 'Credenciales inválidas' };
    }

    const token = jwt.sign(
        { id: user.id, email: user.email },
        env.jwt.secret,
        { expiresIn: env.jwt.expiresIn }
    );

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
};

const getById = async (id) => {
    const { rows } = await pool.query(
        'SELECT id, name, email FROM users WHERE id = $1',
        [id]
    );
    const user = rows[0];

    if (!user) {
        throw { status: 404, message: 'Usuario no encontrado' };
    }

    return user;
};

export default {
    register,
    login,
    getById
};
