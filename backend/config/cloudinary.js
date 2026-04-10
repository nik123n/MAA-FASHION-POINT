const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config(); // Load env in case server didn't load yet

const hasRealCloudinaryConfig = [
  process.env.CLOUDINARY_CLOUD_NAME, 
  process.env.CLOUDINARY_API_KEY, 
  process.env.CLOUDINARY_API_SECRET
].every((value) => value && !value.startsWith('your_'));

if (!hasRealCloudinaryConfig) {
  console.error("Missing Cloudinary Config:");
  console.error({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  throw new Error('Cloudinary configuration is required. Local fallback is disabled.');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'saanjh-boutique/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 1000, crop: 'fill', quality: 'auto' }],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'), false);
      return;
    }
    cb(null, true);
  },
});

const mapUploadedFiles = (req, files = []) => (
  files.map((file) => ({
    url: file.secure_url || file.path, 
    public_id: file.filename || file.public_id 
  }))
);

const deleteStoredImage = async (image = {}) => {
  if (!image?.public_id) return;
  try {
    await cloudinary.uploader.destroy(image.public_id);
  } catch (err) {
    console.error('Cloudinary delete error:', err);
  }
};

module.exports = { cloudinary, upload, hasRealCloudinaryConfig, uploadMode: 'cloudinary', mapUploadedFiles, deleteStoredImage };
