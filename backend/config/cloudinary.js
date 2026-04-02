const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const hasRealCloudinaryConfig = [process.env.CLOUDINARY_CLOUD_NAME, process.env.CLOUDINARY_API_KEY, process.env.CLOUDINARY_API_SECRET]
  .every((value) => value && !value.startsWith('your_'));
const uploadMode = hasRealCloudinaryConfig ? 'cloudinary' : 'local';
const uploadsDir = path.join(__dirname, '..', 'uploads', 'products');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (hasRealCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const storage = hasRealCloudinaryConfig
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'saanjh-boutique/products',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 800, height: 1000, crop: 'fill', quality: 'auto' }],
      },
    })
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadsDir),
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
        const base = path.basename(file.originalname || 'image', ext)
          .replace(/[^a-zA-Z0-9-_]/g, '-')
          .replace(/-+/g, '-')
          .slice(0, 40) || 'image';
        cb(null, `${Date.now()}-${base}${ext}`);
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
  files.map((file) => (
    uploadMode === 'cloudinary'
      ? { url: file.path, public_id: file.filename }
      : {
          url: `${req.protocol}://${req.get('host')}/uploads/products/${file.filename}`,
          public_id: file.filename,
        }
  ))
);

const deleteStoredImage = async (image = {}) => {
  if (!image?.public_id) return;

  if (!hasRealCloudinaryConfig) {
    const localPath = path.join(uploadsDir, image.public_id);
    try {
      await fs.promises.unlink(localPath);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error('Local image delete error:', err);
      }
    }
    return;
  }

  try {
    await cloudinary.uploader.destroy(image.public_id);
  } catch (err) {
    console.error('Cloudinary delete error:', err);
  }
};

module.exports = { cloudinary, upload, hasRealCloudinaryConfig, uploadMode, mapUploadedFiles, deleteStoredImage };
