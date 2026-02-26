const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const router = express.Router();

// ── Helpers ──
function signTokens(userId) {
    const access = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
    const refresh = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
    return { access, refresh };
}

// ── Login rate limiter: 5 attempts / 15 min per IP ──
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, max: 5, skipSuccessfulRequests: true,
    message: { error: 'Too many login attempts. Try again in 15 minutes.' }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { fullName, email, phone, password, role, employeeId, storageUnit, facility, village } = req.body;
        if (!fullName || !email || !phone || !password || !role)
            return res.status(400).json({ error: 'Missing required fields.' });

        const exists = await User.findOne({ email });
        if (exists) return res.status(409).json({ error: 'Email already registered.' });

        // Validate employee/manager code server-side (check DB for valid codes)
        const newUser = await User.create({ fullName, email, phone, password, role, employeeId, storageUnit, facility, village });

        const { access, refresh } = signTokens(newUser._id);
        newUser.refreshToken = refresh;
        await newUser.save();

        res.status(201).json({
            message: newUser.isApproved ? 'Account created.' : 'Registration pending approval.',
            user: newUser,
            accessToken: access,
            refreshToken: refresh,
        });
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ error: 'Email or Employee ID already exists.' });
        res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });

        const user = await User.findOne({ email }).select('+password');
        if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

        const match = await user.comparePassword(password);
        if (!match) return res.status(401).json({ error: 'Invalid credentials.' });

        if (!user.isApproved) return res.status(403).json({ error: 'Account pending approval by admin.' });

        const { access, refresh } = signTokens(user._id);
        user.refreshToken = refresh;
        user.lastLogin = new Date();
        await user.save();

        res.json({ message: 'Login successful.', user, accessToken: access, refreshToken: refresh });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'Refresh token required.' });
    try {
        const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(payload.id);
        if (!user || user.refreshToken !== refreshToken) return res.status(403).json({ error: 'Invalid refresh token.' });
        const { access, refresh } = signTokens(user._id);
        user.refreshToken = refresh;
        await user.save();
        res.json({ accessToken: access, refreshToken: refresh });
    } catch (err) { res.status(403).json({ error: 'Refresh token expired or invalid.' }); }
});

// POST /api/auth/forgot-password (Farmer only)
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required.' });
    const user = await User.findOne({ email, role: 'farmer' });
    if (!user) return res.status(200).json({ message: 'If this email exists, a reset link was sent.' });
    // In production: generate token, send via email
    const token = require('crypto').randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();
    res.json({ message: 'Reset link sent (demo: token=' + token + ')' });
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
        try {
            const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            await User.findByIdAndUpdate(payload.id, { refreshToken: null });
        } catch { }
    }
    res.json({ message: 'Logged out.' });
});

module.exports = router;
