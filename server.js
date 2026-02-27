const app = require('./src/app.js');
const connectMongo = require('./src/config/mongodb.js');
const connectPostgres = require('./src/config/postgres.js');
require('dotenv').config();

const PORT = process.env.PORT || 4001;

const startServer = async () => {
    try {
        await connectMongo();
        console.log('✅ MongoDB conectado');

        await connectPostgres();
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
