# 🛍️ Saanjh Boutique — AI-Powered Ladies Clothing Store

> A complete, production-ready full-stack e-commerce application built with React, Node.js, MongoDB, Razorpay, and Cloudinary.

![Tech Stack](https://img.shields.io/badge/React-18-blue) ![Node](https://img.shields.io/badge/Node.js-20-green) ![MongoDB](https://img.shields.io/badge/MongoDB-7-darkgreen) ![Tailwind](https://img.shields.io/badge/Tailwind-3-cyan)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account (free)
- Razorpay account (test mode)

### 1. Clone & Setup

```bash
git clone <your-repo>
cd saanjh-boutique

# Backend setup
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install
npm run seed        # Seeds sample products + admin user
npm run dev         # Starts on :5000

# Frontend setup (new terminal)
cd ../frontend
npm install
npm run dev         # Starts on :5173
```

### 2. Access the App
| URL | Description |
|-----|-------------|
| `http://localhost:5173` | Customer Store |
| `http://localhost:5173/admin` | Admin Panel |
| `http://localhost:5000/api/health` | API Health Check |

### 3. Test Credentials (after seeding)
| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@saanjhboutique.com` | `Admin@123` |
| User | `priya@example.com` | `User@123` |

### 4. Test Coupons
| Code | Description |
|------|-------------|
| `WELCOME20` | 20% off (max ₹500) |
| `FLAT200` | ₹200 flat off |
| `SAANJH10` | 10% off (max ₹300) |

---

## 🐳 Docker Deployment

```bash
# Copy and fill environment variables
cp .env.example .env

# Build and run all services
docker-compose up --build -d

# Seed database (one-time)
docker exec saanjh_backend node utils/seeder.js

# View logs
docker-compose logs -f backend
```

---

## 📁 Project Structure

```
saanjh-boutique/
├── backend/
│   ├── config/
│   │   └── cloudinary.js          # Cloudinary + Multer setup
│   ├── controllers/
│   │   ├── authController.js      # Register, Login, Profile
│   │   ├── productController.js   # CRUD + AI recommendations
│   │   ├── cartController.js      # Cart management
│   │   ├── orderController.js     # Order lifecycle
│   │   ├── paymentController.js   # Razorpay integration
│   │   ├── adminController.js     # Analytics & user mgmt
│   │   ├── couponController.js    # Coupon system
│   │   └── wishlistController.js  # Wishlist
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT protect/admin guards
│   │   └── errorMiddleware.js     # Global error handler
│   ├── models/
│   │   ├── User.js                # User schema + bcrypt
│   │   ├── Product.js             # Product schema + reviews
│   │   ├── CartOrder.js           # Cart + Order schemas
│   │   └── Coupon.js              # Coupon schema
│   ├── routes/                    # Express route definitions
│   ├── services/
│   │   └── emailService.js        # Nodemailer HTML emails
│   ├── utils/
│   │   └── seeder.js              # Sample data seeder
│   ├── server.js                  # App entry point
│   ├── .env.example
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/            # Navbar, Footer, ScrollToTop
│   │   │   ├── product/           # ProductCard, Skeletons
│   │   │   └── admin/             # AdminLayout sidebar
│   │   ├── pages/
│   │   │   ├── auth/              # Login, Register
│   │   │   ├── admin/             # Dashboard, Products, Orders, Users, Coupons
│   │   │   ├── HomePage.jsx       # Hero, Categories, Featured
│   │   │   ├── ProductsPage.jsx   # Filters, Sort, Pagination
│   │   │   ├── ProductDetailPage.jsx  # Gallery, Size picker, Reviews, AI Recs
│   │   │   ├── CartPage.jsx       # Cart management
│   │   │   ├── CheckoutPage.jsx   # Multi-step + Razorpay
│   │   │   ├── OrdersPage.jsx     # Order history + tracker
│   │   │   ├── ProfilePage.jsx    # Profile + Addresses
│   │   │   └── WishlistPage.jsx
│   │   ├── store/
│   │   │   ├── index.js           # Redux store config
│   │   │   └── slices/            # Auth, Cart, Products, Wishlist, Orders
│   │   ├── utils/
│   │   │   └── api.js             # Axios instance with interceptors
│   │   ├── App.jsx                # Routes + Auth guards
│   │   ├── main.jsx               # React entry
│   │   └── index.css              # Tailwind + custom styles
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── nginx.conf
│   └── Dockerfile
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login + get token |
| GET | `/api/auth/me` | 🔒 | Get current user |
| PUT | `/api/auth/profile` | 🔒 | Update name/phone |
| PUT | `/api/auth/password` | 🔒 | Change password |
| POST | `/api/auth/address` | 🔒 | Add address |
| DELETE | `/api/auth/address/:id` | 🔒 | Remove address |

### Products
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | — | List with filters/sort/pagination |
| GET | `/api/products/home` | — | Featured, New, Trending |
| GET | `/api/products/search/autocomplete?q=` | — | Search suggestions |
| GET | `/api/products/:id` | — | Single product |
| GET | `/api/products/:id/recommendations` | — | AI recommendations |
| POST | `/api/products/:id/reviews` | 🔒 | Add review |
| POST | `/api/products` | 🔒👑 | Create product |
| PUT | `/api/products/:id` | 🔒👑 | Update product |
| DELETE | `/api/products/:id` | 🔒👑 | Delete product |

### Cart
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/cart` | 🔒 | Get cart |
| POST | `/api/cart` | 🔒 | Add item |
| PUT | `/api/cart/:itemId` | 🔒 | Update quantity |
| DELETE | `/api/cart/:itemId` | 🔒 | Remove item |
| DELETE | `/api/cart` | 🔒 | Clear cart |

### Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/orders` | 🔒 | Place order |
| GET | `/api/orders/my` | 🔒 | My order history |
| GET | `/api/orders/:id` | 🔒 | Order details |
| PUT | `/api/orders/:id/cancel` | 🔒 | Cancel order |
| GET | `/api/orders` | 👑 | All orders (admin) |
| PUT | `/api/orders/:id/status` | 👑 | Update status |

### Payments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/payments/create-order` | 🔒 | Create Razorpay order |
| POST | `/api/payments/verify` | 🔒 | Verify payment signature |
| POST | `/api/payments/webhook` | — | Razorpay webhook |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/analytics` | 👑 | Dashboard analytics |
| GET | `/api/admin/users` | 👑 | All users |
| PATCH | `/api/admin/users/:id/toggle` | 👑 | Block/unblock user |

🔒 = Requires login &nbsp; 👑 = Admin only

---

## 💳 Razorpay Setup

1. Sign up at [razorpay.com](https://razorpay.com)
2. Go to Settings → API Keys → Generate Test Key
3. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to `.env`
4. For webhooks in production: Settings → Webhooks → Add `https://yourdomain.com/api/payments/webhook`

---

## ☁️ Cloudinary Setup

1. Sign up free at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard → copy Cloud Name, API Key, API Secret
3. Add to `.env`

---

## 📧 Email Setup (Gmail)

1. Enable 2FA on your Google account
2. Go to Google Account → Security → App Passwords
3. Generate a 16-character app password
4. Add to `.env` as `EMAIL_PASS`

---

## 🌐 Production Deployment

### Railway (Recommended)
```bash
# Backend
railway login
cd backend && railway up

# Frontend — build and deploy to Vercel/Netlify
cd frontend
npm run build
# Deploy dist/ folder
```

### Vercel (Frontend)
```bash
cd frontend
npx vercel --prod
```

### MongoDB Atlas
1. Create cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Get connection string
3. Update `MONGO_URI` in `.env`

---

## 🎨 Customization

### Change Brand Colors
Edit `frontend/tailwind.config.js` → `colors.brand.*`

### Add New Categories
1. Update `CATEGORIES` array in `backend/models/Product.js`
2. Update `CATEGORY_DATA` in `frontend/src/pages/HomePage.jsx`
3. Update category list in `Navbar.jsx`

### AI Recommendations
Currently uses content-based filtering (category + occasion + price range similarity).
To upgrade to ML-based recommendations, replace the `getRecommendations` controller logic with your preferred vector similarity service.

---

## 📊 Database Schemas

### User
```
name, email, password (hashed), phone, role, addresses[], wishlist[], preferences, isActive
```

### Product  
```
name, description, price, discountedPrice, category, images[], sizes[{size, stock}], 
colors[], fabric, occasion[], tags[], reviews[], rating, isFeatured, isNewArrival, isTrending
```

### Order
```
orderNumber, user, items[], shippingAddress, pricing{subtotal,shipping,tax,discount,total},
payment{method,status,razorpayOrderId,...}, orderStatus, statusHistory[]
```

### Cart
```
user, items[{product, quantity, size, color, price}], couponApplied
```

---

## 🔒 Security Features

- JWT authentication with HttpOnly-safe token storage
- bcrypt password hashing (salt rounds: 12)
- Rate limiting (200 req/15min per IP)
- Helmet.js security headers
- Input validation & sanitization
- CORS protection
- Mongoose schema validation
- Razorpay HMAC signature verification

---

## 📦 Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Redux Toolkit, Framer Motion |
| Backend | Node.js, Express.js, Mongoose |
| Database | MongoDB 7 |
| Auth | JWT + bcrypt |
| Payments | Razorpay |
| Images | Cloudinary + Multer |
| Email | Nodemailer (Gmail SMTP) |
| Deployment | Docker + Nginx |

---

Made with ❤️ for Saanjh Boutique
