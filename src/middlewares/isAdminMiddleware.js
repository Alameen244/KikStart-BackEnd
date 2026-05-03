// middlewares/isAdmin.js
const isAdmin = (req, res, next) => {
    const jwtPayload = req.jwtPayload;
    const role = jwtPayload?.role;

    if (!jwtPayload?.id) {
        return res.status(401).json({
            success: false,
            message: "Authentication required."
        });
    }

    if (role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Access denied. Admins only."
        });
    }

    next();
};

export default isAdmin;
