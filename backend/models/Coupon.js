const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String },
    discountType: { type: String, enum: ['flat', 'percent'], required: true },
    discountValue: { type: Number, required: true },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscount: { type: Number }, // cap for percent discounts
    usageLimit: { type: Number, default: null }, // null = unlimited
    usedCount: { type: Number, default: 0 },
    userLimit: { type: Number, default: 1 }, // per user
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    validFrom: { type: Date, default: Date.now },
    validUntil: { type: Date, required: true },
    applicableCategories: [String], // empty = all categories
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);
