const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    unitId: { type: String, required: true },
    cropId: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop' },
    type: { type: String, enum: ['temperature', 'humidity', 'spoilage', 'expiry', 'power', 'manual'], required: true },
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'warning' },
    message: { type: String, required: true },
    sentVia: { type: [String], enum: ['sms', 'whatsapp', 'voice', 'email', 'push'] },
    sentTo: { type: [String] }, // phone numbers
    sentAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date },
    isResolved: { type: Boolean, default: false },
    triggeredBy: { type: String, enum: ['system', 'employee', 'manager', 'admin'], default: 'system' }
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);
