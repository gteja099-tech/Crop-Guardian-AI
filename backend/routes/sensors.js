const express = require('express');
const SensorReading = require('../models/SensorReading');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

// GET /api/sensors — Get latest readings per unit
router.get('/', async (req, res) => {
    try {
        const units = ['unit1', 'unit2', 'unit3', 'unit4'];
        const readings = await Promise.all(units.map(u =>
            SensorReading.findOne({ unitId: u }).sort({ timestamp: -1 })
        ));
        res.json({ sensors: readings.filter(Boolean) });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/sensors/:unitId/history
router.get('/:unitId/history', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const readings = await SensorReading.find({ unitId: req.params.unitId })
            .sort({ timestamp: -1 }).limit(limit);
        res.json({ readings });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/sensors — IoT sensor push (Employee+)
router.post('/', authorize('employee', 'manager', 'admin'), async (req, res) => {
    try {
        const reading = await SensorReading.create(req.body);
        res.status(201).json({ reading });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
