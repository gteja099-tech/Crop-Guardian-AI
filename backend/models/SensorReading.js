const mongoose = require('mongoose');

const sensorReadingSchema = new mongoose.Schema({
    unitId: { type: String, required: true },
    temperature: { type: Number, required: true },
    humidity: { type: Number, required: true },
    co2Level: { type: Number },
    powerDraw: { type: Number },
    doorOpen: { type: Boolean, default: false },
    isAnomaly: { type: Boolean, default: false },
    anomalyScore: { type: Number },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: false });

sensorReadingSchema.index({ unitId: 1, timestamp: -1 });

module.exports = mongoose.model('SensorReading', sensorReadingSchema);
