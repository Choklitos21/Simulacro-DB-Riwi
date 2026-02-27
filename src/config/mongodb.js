const mongoose = require('mongoose');
const env = require('./env.js');

const connectMongo = async () => {
    try {
        await mongoose.connect(env.mongo.uri);

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB desconectado');
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ Error en MongoDB:', err);
        });

    } catch (error) {
        console.error('❌ Error al conectar MongoDB:', error);
        process.exit(1);
    }
};

export default connectMongo()
