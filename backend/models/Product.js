const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    discountedPrice: { type: Number, min: 0 },
    discountPercent: { type: Number, default: 0 },
    category: {
      type: String,
      required: true,
      enum: ['3 Piece', '3 Piece Pair', 'Short Top', '2 Piece', 'Tunic Top', 'Cotton Tunic Top', 'Long Top', 'Cord Set', 'Plazo Pair', 'Kurti Plaza Dupata', 'Kurti Pent Dupata', 'Cotton Straight Pent'],
    },
    subcategory: { type: String },
    brand: { type: String, default: 'Saanjh' },
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String },
      },
    ],
    sizes: [
      {
        size: { type: String, enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'] },
        stock: { type: Number, default: 0 },
      },
    ],
    colors: [{ name: String, hex: String }],
    fabric: { type: String },
    occasion: [String],
    tags: [String],
    reviews: [reviewSchema],
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    totalStock: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
    sku: { type: String, unique: true },
    weight: { type: Number }, // grams, for shipping
    returnPolicy: { type: String, default: '7 days easy return' },
    careInstructions: [String],
    // AI recommendation fields
    embedding: [Number], // product feature vector
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes for search performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ isFeatured: 1, isNewArrival: 1, isTrending: 1 });

// Compute total stock before save
productSchema.pre('save', function (next) {
  this.totalStock = this.sizes.reduce((acc, s) => acc + s.stock, 0);
  if (this.discountedPrice && this.price) {
    this.discountPercent = Math.round(((this.price - this.discountedPrice) / this.price) * 100);
  }
  if (!this.sku) {
    this.sku = `SB-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  }
  next();
});

// Update rating after review added
productSchema.methods.updateRating = function () {
  if (this.reviews.length === 0) {
    this.rating = 0;
    this.numReviews = 0;
  } else {
    this.rating = this.reviews.reduce((acc, r) => acc + r.rating, 0) / this.reviews.length;
    this.numReviews = this.reviews.length;
  }
};

module.exports = mongoose.model('Product', productSchema);
