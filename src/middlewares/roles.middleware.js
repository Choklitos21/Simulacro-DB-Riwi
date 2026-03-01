export const hasRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return error(res, 'Unauthenticated user', 401);
        }

        if (!allowedRoles.includes(req.user.role)) {
            return error(res, 'You do not have permission to perform this action.', 403);
        }

        next();
    };
};

export const error = (res, message, status = 400) => {
    return res.status(status).json({
        success: false,
        error: message
    });
};
