// ═══════════════════════════════════════════════
// CropGuardianAI — Express Backend Server
// ═══════════════════════════════════════════════
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const WebSocket = require('ws');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// ── Middleware ──
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// ── Rate limiter (global) ──
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: 'Too many requests.' });
app.use(globalLimiter);

// ── Routes ──
app.use('/api/auth', require('./routes/auth'));
app.use('/api/crops', require('./routes/crops'));
app.use('/api/sensors', require('./routes/sensors'));
app.use('/api/predictions', require('./routes/predictions'));

// ── Health check ──
app.get('/api/health', (req, res) => res.json({
    status: 'ok', service: 'CropGuardianAI Backend',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
}));

// ── 404 handler ──
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Error handler ──
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── WebSocket: Broadcast sensor data ──
const clients = new Set();
wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('WS client connected. Total:', clients.size);
    ws.on('close', () => clients.delete(ws));
});

// Simulate broadcasting sensor readings every 5 seconds
setInterval(() => {
    const sensorData = {
        type: 'sensor_update',
        timestamp: new Date().toISOString(),
        units: [
            { id: 'unit1', temp: +(4.2 + (Math.random() - .5) * 0.8).toFixed(2), humidity: +(87 + (Math.random() - .5) * 4).toFixed(1) },
            { id: 'unit2', temp: +(3.9 + (Math.random() - .5) * 1.2).toFixed(2), humidity: +(94 + (Math.random() - .5) * 3).toFixed(1) },
            { id: 'unit3', temp: +(5.1 + (Math.random() - .5) * 0.6).toFixed(2), humidity: +(85 + (Math.random() - .5) * 3).toFixed(1) },
            { id: 'unit4', temp: +(4.5 + (Math.random() - .5) * 0.4).toFixed(2), humidity: +(83 + (Math.random() - .5) * 2).toFixed(1) },
        ]
    };
    const msg = JSON.stringify(sensorData);
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) client.send(msg);
    });
}, 5000);

// ── DB connect + Start ──
const PORT = process.env.PORT || 3001;
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cropguardian')
    .then(() => {
        console.log('✅ MongoDB connected');
        server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    })
    .catch(err => {
        console.error('❌ MongoDB connection failed:', err.message);
        // Start server anyway for dev
        server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} (MongoDB offline)`));
    });

module.exports = app;
