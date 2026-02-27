const { pool } = require('../config/postgres.js');

const getAll = async () => {
    const { rows } = await pool.query(
        'SELECT id, name, email FROM users'
    );
    return rows;
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

const update = async (id, { name, email }) => {
    const { rows } = await pool.query(
        'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email',
        [name, email, id]
    );
    const user = rows[0];

    if (!user) {
        throw { status: 404, message: 'Usuario no encontrado' };
    }

    return user;
};

const remove = async (id) => {
    const { rows } = await pool.query(
        'DELETE FROM users WHERE id = $1 RETURNING id',
        [id]
    );

    if (rows.length === 0) {
        throw { status: 404, message: 'Usuario no encontrado' };
    }
};

export default {
    getAll,
    getById,
    update,
    remove
};
