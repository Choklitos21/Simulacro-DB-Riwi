require('dotenv').config();

const env = {
    // Servidor
    PORT: process.env.PORT || 4001,
    NODE_ENV: process.env.NODE_ENV || 'development',

    // PostgreSQL
    postgres: {
        host: process.env.PG_HOST,
        port: process.env.PG_PORT || 5432,
        user: process.env.PG_USER,
        password: process.env.PG_PASSWORD,
        database: process.env.PG_DATABASE,
    },

    // MongoDB
    mongo: {
        uri: process.env.MONGO_URI,
    },

    // JWT
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
};

// Validar variables obligatorias
const requiredVars = [
    'PG_HOST',
    'PG_USER',
    'PG_PASSWORD',
    'PG_DATABASE',
    'MONGO_URI',
    'JWT_SECRET',
];

requiredVars.forEach((key) => {
    if (!process.env[key]) {
        throw new Error(`❌ Variable de entorno faltante: ${key}`);
    }
});

export default env;
