require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

const sampleProducts = [
  {
    name: 'Banarasi Silk Saree - Royal Blue',
    description: 'Exquisite handwoven Banarasi silk saree with intricate zari work. Perfect for weddings and festive occasions. Comes with matching blouse piece.',
    price: 8999,
    discountedPrice: 6499,
    category: '3 Piece',
    brand: 'Saanjh',
    images: [
      { url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800', public_id: 'saree1' },
    ],
    sizes: [{ size: 'Free Size', stock: 25 }],
    colors: [{ name: 'Royal Blue', hex: '#4169e1' }],
    fabric: 'Banarasi Silk',
    occasion: ['Wedding', 'Festival', 'Party'],
    tags: ['silk', 'banarasi', 'wedding', 'zari', 'traditional'],
    isFeatured: true,
    rating: 4.8,
    numReviews: 124,
    sold: 89,
  },
  {
    name: 'Floral Chiffon Maxi Dress',
    description: 'Breezy floral chiffon maxi dress with flutter sleeves. Lightweight and elegant, perfect for summer parties, beach outings, and casual brunches.',
    price: 2499,
    discountedPrice: 1799,
    category: 'Short Top',
    images: [
      { url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800', public_id: 'dress1' },
    ],
    sizes: [
      { size: 'XS', stock: 10 }, { size: 'S', stock: 20 }, { size: 'M', stock: 25 },
      { size: 'L', stock: 15 }, { size: 'XL', stock: 8 },
    ],
    colors: [{ name: 'Floral Pink', hex: '#ff9eb5' }, { name: 'Mint', hex: '#98d8c8' }],
    fabric: 'Chiffon',
    occasion: ['Casual', 'Beach', 'Party'],
    tags: ['maxi', 'floral', 'summer', 'chiffon', 'western'],
    isNewArrival: true,
    isTrending: true,
    rating: 4.5,
    numReviews: 67,
    sold: 143,
  },
  {
    name: 'Lucknowi Chikankari Kurti',
    description: 'Hand-embroidered Lucknowi chikankari kurti in pure cotton. The delicate threadwork makes it perfect for both office wear and casual occasions.',
    price: 1899,
    discountedPrice: 1299,
    category: 'Kurti Plaza Dupata',
    images: [
      { url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800', public_id: 'kurti1' },
    ],
    sizes: [
      { size: 'S', stock: 30 }, { size: 'M', stock: 35 }, { size: 'L', stock: 28 },
      { size: 'XL', stock: 20 }, { size: 'XXL', stock: 12 },
    ],
    colors: [{ name: 'White', hex: '#ffffff' }, { name: 'Blush Pink', hex: '#ffb6c1' }],
    fabric: 'Pure Cotton',
    occasion: ['Casual', 'Office', 'Festival'],
    tags: ['chikankari', 'lucknowi', 'cotton', 'embroidery', 'ethnic'],
    isFeatured: true,
    isNewArrival: true,
    rating: 4.7,
    numReviews: 203,
    sold: 312,
  },
  {
    name: 'Crop Top - Abstract Print',
    description: 'Trendy abstract print crop top with puff sleeves. Pair with high-waist jeans or skirts for a chic look. Soft and stretchy fabric for all-day comfort.',
    price: 899,
    discountedPrice: 649,
    category: 'Tunic Top',
    images: [
      { url: 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=800', public_id: 'top1' },
    ],
    sizes: [
      { size: 'XS', stock: 15 }, { size: 'S', stock: 25 }, { size: 'M', stock: 30 },
      { size: 'L', stock: 20 }, { size: 'XL', stock: 10 },
    ],
    colors: [{ name: 'Terracotta', hex: '#e2725b' }, { name: 'Sage', hex: '#87a878' }],
    fabric: 'Cotton Blend',
    occasion: ['Casual', 'College', 'Outing'],
    tags: ['crop', 'western', 'trendy', 'puff sleeves', 'abstract'],
    isTrending: true,
    rating: 4.3,
    numReviews: 89,
    sold: 276,
  },
  {
    name: 'Bridal Lehenga Choli - Crimson Red',
    description: 'Stunning bridal lehenga in crimson red with heavy zardosi embroidery. Includes lehenga, choli, and dupatta. A dream come true for your special day.',
    price: 45999,
    discountedPrice: 38999,
    category: '3 Piece Pair',
    images: [
      { url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800', public_id: 'lehenga1' },
    ],
    sizes: [
      { size: 'S', stock: 5 }, { size: 'M', stock: 8 }, { size: 'L', stock: 6 },
      { size: 'XL', stock: 4 }, { size: 'XXL', stock: 3 },
    ],
    colors: [{ name: 'Crimson Red', hex: '#dc143c' }, { name: 'Magenta', hex: '#ff00ff' }],
    fabric: 'Velvet with Net',
    occasion: ['Wedding', 'Engagement', 'Reception'],
    tags: ['bridal', 'lehenga', 'wedding', 'zardosi', 'heavy embroidery'],
    isFeatured: true,
    rating: 4.9,
    numReviews: 45,
    sold: 38,
  },
  {
    name: 'Anarkali Salwar Suit - Teal',
    description: 'Graceful Anarkali style salwar suit in rich teal color. Features beautiful lace borders and comes with matching dupatta. Ideal for festive gatherings.',
    price: 3499,
    discountedPrice: 2699,
    category: 'Kurti Pent Dupata',
    images: [
      { url: 'https://images.unsplash.com/photo-1583391733981-8498408ee4b6?w=800', public_id: 'suit1' },
    ],
    sizes: [
      { size: 'S', stock: 18 }, { size: 'M', stock: 22 }, { size: 'L', stock: 20 },
      { size: 'XL', stock: 15 }, { size: 'XXL', stock: 10 },
    ],
    colors: [{ name: 'Teal', hex: '#008080' }, { name: 'Maroon', hex: '#800000' }],
    fabric: 'Georgette',
    occasion: ['Festival', 'Casual', 'Family Function'],
    tags: ['anarkali', 'salwar', 'festive', 'georgette', 'ethnic'],
    isTrending: true,
    rating: 4.6,
    numReviews: 112,
    sold: 195,
  },
  {
    name: 'Embroidered Organza Saree - Peach',
    description: 'Delicate organza saree with thread embroidery and sequin work. The peach color makes it perfect for daytime events, mehndi ceremonies, and sangeets.',
    price: 6499,
    discountedPrice: 4999,
    category: '2 Piece',
    images: [
      { url: 'https://images.unsplash.com/photo-1617217882921-45781b2d22c7?w=800', public_id: 'saree2' },
    ],
    sizes: [{ size: 'Free Size', stock: 20 }],
    colors: [{ name: 'Peach', hex: '#ffcba4' }, { name: 'Lavender', hex: '#e6e6fa' }],
    fabric: 'Organza',
    occasion: ['Mehndi', 'Sangeet', 'Festival'],
    tags: ['organza', 'sequin', 'embroidery', 'party', 'light'],
    isNewArrival: true,
    rating: 4.6,
    numReviews: 78,
    sold: 67,
  },
  {
    name: 'Bohemian Wrap Maxi Dress',
    description: 'Free-spirited bohemian wrap dress with tiered skirt and adjustable waist tie. The flowing silhouette flatters all body types.',
    price: 3199,
    discountedPrice: 2399,
    category: 'Long Top',
    images: [
      { url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800', public_id: 'dress2' },
    ],
    sizes: [
      { size: 'XS', stock: 8 }, { size: 'S', stock: 18 }, { size: 'M', stock: 22 },
      { size: 'L', stock: 16 }, { size: 'XL', stock: 10 },
    ],
    colors: [{ name: 'Rust Orange', hex: '#b7410e' }, { name: 'Forest Green', hex: '#228b22' }],
    fabric: 'Rayon',
    occasion: ['Casual', 'Vacation', 'Beach'],
    tags: ['bohemian', 'maxi', 'wrap', 'western', 'summer'],
    isFeatured: true,
    rating: 4.4,
    numReviews: 156,
    sold: 234,
  },
];

const sampleCoupons = [
  {
    code: 'WELCOME20',
    description: '20% off on your first order',
    discountType: 'percent',
    discountValue: 20,
    minOrderAmount: 999,
    maxDiscount: 500,
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  },
  {
    code: 'FLAT200',
    description: 'Flat ₹200 off on orders above ₹1499',
    discountType: 'flat',
    discountValue: 200,
    minOrderAmount: 1499,
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  },
  {
    code: 'SAANJH10',
    description: '10% off sitewide, max ₹300',
    discountType: 'percent',
    discountValue: 10,
    maxDiscount: 300,
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    // Clear existing data
    await Promise.all([User.deleteMany(), Product.deleteMany(), Coupon.deleteMany()]);
    console.log('Cleared existing data');

    // Create admin user
    const admin = await User.create({
      name: 'Saanjh Admin',
      email: process.env.ADMIN_EMAIL || 'maafashtionpoint@gmail.com',
      password: 'Admin@123',
      role: 'admin',
    });
    console.log(`Admin created: ${admin.email}`);

    // Create test user
    await User.create({
      name: 'Priya Sharma',
      email: 'priya@example.com',
      password: 'User@123',
      phone: '9876543210',
    });
    console.log('Test user created: priya@example.com');

    // Create products
    const products = await Product.insertMany(sampleProducts);
    console.log(`${products.length} products seeded`);

    // Create coupons
    const coupons = await Coupon.insertMany(sampleCoupons);
    console.log(`${coupons.length} coupons seeded`);

    console.log('\n✅ Database seeded successfully!');
    console.log(`Admin login: ${process.env.ADMIN_EMAIL || 'maafashtionpoint@gmail.com'} / ${process.env.ADMIN_PASSWORD || 'maafashtionpoint'}`);
    console.log('User login:  priya@example.com / User@123');
    console.log('Test coupons: WELCOME20, FLAT200, SAANJH10');

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedDB();
