import jwt from 'jsonwebtoken';

const middleware = (req, res, next) => {
    const authorization = req.headers.authorization
    if (!authorization) return res.status(401).json({ error: 'Token not found' });

    if (!authorization.startsWith('Bearer ')) return res.status(401).json({ error: 'Invalid authorization scheme' });
    const token = authorization.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'unauthorized' });

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);

        req.jwtPayload = decoded
        next();
    } catch (err) {
        res.status(401).json({
            error: 'Invalid token'
        });
    }
}

const generateToken = (userData) => {
    return jwt.sign(userData, process.env.SECRET_KEY, { expiresIn: process.env.TOKEN_EXPIRY || '7d' });
}

export { middleware, generateToken };
