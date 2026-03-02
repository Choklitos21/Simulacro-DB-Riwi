import app from './src/app.js';
import connectMongo from './src/config/mongodb.js';
import pool from './src/config/postgres.js';
import 'dotenv/config';


const PORT = process.env.PORT || 4001;

const startServer = async () => {
    try {
        await connectMongo();
        console.log('✅ MongoDB conectado');

        await pool.connect();
        console.log('✅ PostgreSQL conectado');

        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

startServer();

// ALTER TABLE nombre_de_tu_tabla
ADD COLUMN id UUID DEFAULT gen_random_uuid() PRIMARY KEY;

