const express = require('express');
const cors = require('cors');
const errorMiddleware = require('./middlewares/error.middleware.js');

const authRoutes = require('./routes/auth.routes.js');
const userRoutes = require('./routes/user.routes.js');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server running' });
});

app.use(errorMiddleware);

export default app;
