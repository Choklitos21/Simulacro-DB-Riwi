import userService from '../services/user.service.js';

const getAll = async (req, res, next) => {
    try {
        const users = await userService.getAll();
        res.status(200).json({ ok: true, data: users });
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        const user = await userService.getById(req.params.id);
        res.status(200).json({ ok: true, data: user });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const { name, email } = req.body;
        const user = await userService.update(req.params.id, { name, email });
        res.status(200).json({ ok: true, data: user });
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        await userService.remove(req.params.id);
        res.status(200).json({ ok: true, message: 'Usuario eliminado' });
    } catch (error) {
        next(error);
    }
};

export default {
    getAll,
    getById,
    update,
    remove
};
