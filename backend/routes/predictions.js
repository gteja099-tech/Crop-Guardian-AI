const express = require('express');
const axios = require('axios');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

// POST /api/predictions/predict
router.post('/predict', async (req, res) => {
    try {
        const { temp_readings, humidity_readings, crop_type, storage_duration } = req.body;
        const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/predict`, {
            temp_readings, humidity_readings, crop_type, storage_duration
        });
        res.json(mlResponse.data);
    } catch (err) {
        // Fallback with simple heuristic if ML service is offline
        const body = req.body;
        const avgTemp = (body.temp_readings || [4]).reduce((a, b) => a + b, 0) / (body.temp_readings?.length || 1);
        const avgHum = (body.humidity_readings || [85]).reduce((a, b) => a + b, 0) / (body.humidity_readings?.length || 1);
        const tempRisk = Math.max(0, (avgTemp - 4) * 8);
        const humRisk = Math.max(0, (avgHum - 90) * 3);
        const spoilage = Math.min(95, tempRisk + humRisk + 5);
        res.json({ spoilage_probability: spoilage, safe_days: Math.max(1, 30 - spoilage * 0.3), risk_class: spoilage > 60 ? 'high' : spoilage > 25 ? 'medium' : 'low', source: 'fallback' });
    }
});

// POST /api/predictions/anomaly
router.post('/anomaly', async (req, res) => {
    try {
        const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/anomaly`, req.body);
        res.json(mlResponse.data);
    } catch (err) {
        res.json({ is_anomaly: false, anomaly_score: -0.1, source: 'fallback' });
    }
});

module.exports = router;
