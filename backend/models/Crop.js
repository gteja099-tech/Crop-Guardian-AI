const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, enum: ['kg', 'ton', 'quintal'], default: 'kg' },
    costPerUnit: { type: Number, required: true },
    storedDate: { type: Date, default: Date.now },
    withdrawnDate: { type: Date },
    expectedExpiry: { type: Date, required: true },
    storageUnit: { type: String, required: true },
    status: { type: String, enum: ['active', 'withdrawn', 'spoiled'], default: 'active' },
    idealTemp: { type: Number },
    idealHumidity: { type: Number },
    batchId: { type: String },
    notes: { type: String },
}, { timestamps: true });

// FEFO: sort by expected expiry ASC
cropSchema.index({ owner: 1, expectedExpiry: 1 });

// Virtual: total cost
cropSchema.virtual('totalCost').get(function () { return this.quantity * this.costPerUnit; });

module.exports = mongoose.model('Crop', cropSchema);
