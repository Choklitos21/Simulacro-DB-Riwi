const errorMiddleware = (err, req, res, next) => {
    console.error(`[ERROR] ${req.method} ${req.url}:`, err);

    // Errores lanzados manualmente desde los services { status, message }
    if (err.status) {
        return res.status(err.status).json({
            ok: false,
            message: err.message,
        });
    }

    // Error de PostgreSQL - campo duplicado
    if (err.code === '23505') {
        return res.status(400).json({
            ok: false,
            message: 'Ya existe un registro con esos datos',
        });
    }

    // Error de PostgreSQL - violación de llave foránea
    if (err.code === '23503') {
        return res.status(400).json({
            ok: false,
            message: 'Referencia a un registro que no existe',
        });
    }

    // Error genérico
    res.status(500).json({
        ok: false,
        message: 'Error interno del servidor',
    });
};

export default errorMiddleware;
