const { Pool } = require('pg');
require('dotenv').config();

const env = require('./env.js');

const pool = new Pool({
    host: env.postgres.host,
    port: env.postgres.port,
    user: env.postgres.user,
    password: env.postgres.password,
    database: env.postgres.database,
});

const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('✅ Database connected successfully');
        client.release();
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
    }
};

testConnection();

// Exportas el pool para usarlo en los modelos con pool.query()
export default pool;
