const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ── protect: verify JWT access token ──
exports.protect = async (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer '))
        return res.status(401).json({ error: 'Not authenticated.' });

    const token = auth.split(' ')[1];
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(payload.id).select('-password -refreshToken');
        if (!user) return res.status(401).json({ error: 'User not found.' });
        if (!user.isApproved) return res.status(403).json({ error: 'Account pending approval.' });
        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Token expired or invalid.' });
    }
};

// ── authorize: role-based access control ──
exports.authorize = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role))
        return res.status(403).json({ error: `Role '${req.user.role}' is not allowed to access this resource.` });
    next();
};
