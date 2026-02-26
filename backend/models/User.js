const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String, required: true },
    role: { type: String, enum: ['farmer', 'employee', 'manager', 'admin'], default: 'farmer' },
    employeeId: { type: String, unique: true, sparse: true },
    isApproved: { type: Boolean, default: false },
    storageUnit: { type: String },
    facility: { type: String },
    village: { type: String },
    refreshToken: { type: String },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
    lastLogin: { type: Date },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Pre-save: hash password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidate) {
    return bcrypt.compare(candidate, this.password);
};

// Auto-approve farmers; employee & manager need approval
userSchema.pre('save', function (next) {
    if (this.isNew && this.role === 'farmer') this.isApproved = true;
    next();
});

// Remove password from toJSON output
userSchema.set('toJSON', {
    transform: (doc, ret) => { delete ret.password; delete ret.refreshToken; delete ret.resetToken; return ret; }
});

module.exports = mongoose.model('User', userSchema);
