const express = require('express');
const Crop = require('../models/Crop');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

// All crop routes require auth
router.use(protect);

// GET /api/crops — Farmer sees own; Employee/Manager see all
router.get('/', async (req, res) => {
    try {
        const filter = req.user.role === 'farmer' ? { owner: req.user._id } : {};
        const crops = await Crop.find(filter).sort({ expectedExpiry: 1 }).populate('owner', 'fullName email storageUnit');
        res.json({ crops });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/crops — Farmer only
router.post('/', authorize('farmer'), async (req, res) => {
    try {
        const crop = await Crop.create({ ...req.body, owner: req.user._id });
        res.status(201).json({ crop });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// PATCH /api/crops/:id — Farmer (own) or Employee+
router.patch('/:id', async (req, res) => {
    try {
        const filter = req.user.role === 'farmer' ? { _id: req.params.id, owner: req.user._id } : { _id: req.params.id };
        const crop = await Crop.findOneAndUpdate(filter, req.body, { new: true, runValidators: true });
        if (!crop) return res.status(404).json({ error: 'Crop not found.' });
        res.json({ crop });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/crops/:id — Manager+ only
router.delete('/:id', authorize('manager', 'admin'), async (req, res) => {
    try {
        await Crop.findByIdAndDelete(req.params.id);
        res.json({ message: 'Crop deleted.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
