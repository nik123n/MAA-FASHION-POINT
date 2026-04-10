const admin = require('../config/firebaseAdmin');
const { getFirestore } = require('firebase-admin/firestore');
const { logger } = require('../utils/logger');

const SAMPLE_PRODUCTS = [
  {
    name: 'Elegant Salwar Suit - Maroon',
    description: 'Premium maroon salwar suit with digital print and heavy embroidery. Perfect for weddings and festivals.',
    price: 2999,
    discountedPrice: 2399,
    discountPercent: 20,
    category: '3 Piece',
    subcategory: 'Embroidered Salwar',
    brand: 'Saanjh',
    images: [
      { url: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&q=auto&fm=webp' },
      { url: 'https://images.unsplash.com/photo-1608250174392-b2e946fb9df2?w=800&q=auto&fm=webp' }
    ],
    sizes: [
      { size: 'M', stock: 5 },
      { size: 'L', stock: 8 },
      { size: 'XL', stock: 3 }
    ],
    colors: ['Maroon', 'Gold'],
    fabric: 'Georgette with Santoon dupatta',
    occasion: ['Wedding', 'Party'],
    tags: ['embroidered', 'heavy-work', 'digital-print'],
    isFeatured: true,
    isNewArrival: true,
    totalStock: 16,
    sold: 12,
    rating: 4.8,
    numReviews: 23,
    sku: 'MFP-SEED-001',
    careInstructions: ['Dry Clean Only', 'Do Not Bleach']
  },
  {
    name: 'Cotton Straight Kurti - Blue',
    description: 'Comfortable A-line cotton kurti perfect for daily wear. Rayon lining for extra comfort.',
    price: 1299,
    discountedPrice: 999,
    discountPercent: 23,
    category: 'Kurti',
    subcategory: 'Cotton Kurti',
    brand: 'Saanjh',
    images: [
      { url: 'https://images.unsplash.com/photo-1593776157535-8f923a391645?w=800&q=auto&fm=webp' },
      { url: 'https://images.unsplash.com/photo-1621345805686-ba384b983b91?w=800&q=auto&fm=webp' }
    ],
    sizes: [
      { size: 'S', stock: 10 },
      { size: 'M', stock: 15 },
      { size: 'L', stock: 12 },
      { size: 'XL', stock: 7 }
    ],
    colors: ['Blue', 'White'],
    fabric: 'Pure Cotton',
    occasion: ['Casual', 'Office'],
    tags: ['cotton', 'daily-wear', 'a-line'],
    isTrending: true,
    totalStock: 44,
    sold: 28,
    rating: 4.6,
    numReviews: 15,
    sku: 'MFP-SEED-002',
    careInstructions: ['Machine Wash Cold', 'Tumble Dry Low']
  },
  {
    name: 'Plazo Set with Kurti - Black',
    description: 'Stylish black kurti with printed plazo set. Perfect for evening wear and functions.',
    price: 1899,
    category: 'Kurti Plaza Dupata',
    brand: 'Saanjh',
    images: [
      { url: 'https://images.unsplash.com/photo-1607345266584-613e4ed4f59a?w=800&q=auto&fm=webp' }
    ],
    sizes: [
      { size: 'Free Size', stock: 6 }
    ],
    colors: ['Black'],
    fabric: 'Georgette',
    tags: ['plazo-set', 'printed'],
    totalStock: 6,
    sold: 2,
    rating: 4.9,
    numReviews: 8,
    sku: 'MFP-SEED-003'
  }
];

const db = getFirestore();

const seedProducts = async () => {
  console.log('🌱 Starting product seeding...');
  
  let successCount = 0;
  
  for (const productData of SAMPLE_PRODUCTS) {
    try {
      const docRef = db.collection('products').doc();
      const product = {
        ...productData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await docRef.set(product);
      console.log(`✅ Seeded: ${product.name} (ID: ${docRef.id})`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to seed ${productData.name}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Seeding complete! ${successCount}/${SAMPLE_PRODUCTS.length} products added.`);
  console.log('🔄 Restart frontend (localhost:5173) to see images!');
  console.log('📱 Test API: curl http://localhost:5000/api/v1/products');
  
  process.exit(0);
};

if (require.main === module) {
  if (!admin) {
    console.error('❌ Firebase Admin not initialized. Run "npm run ensure-admin" first.');
    process.exit(1);
  }
  seedProducts();
}

module.exports = { seedProducts };

