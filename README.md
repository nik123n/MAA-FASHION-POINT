# Maa Fashion Point

Maa Fashion Point is a modern, responsive, and feature-rich e-commerce web application. Designed with a mobile-first, app-like UI, it provides a seamless shopping experience for users while offering robust management tools via its backend.

## 🌟 Key Features

- **Mobile-First App-like UI:** Styled beautifully with Tailwind CSS, bringing a Native-App feel directly into the browser.
- **Firebase Authentication:** Secure and reliable user management seamlessly powered by Firebase.
- **Product & Category Browsing:** Interactive and dynamic horizontal scrollable categories and grid-based product listing.
- **Love Story Timeline:** An emotional, interactive, and beautifully animated section documenting milestones.
- **Comprehensive E-Commerce Capabilities:** Full shopping cart, checkout process, and order management.
- **Admin Dashboard:** Real-time analytics, product management, and user management.
- **Fully Responsive:** Beautiful layouts and animations on all screen sizes, powered by Framer Motion.

## 🛠️ Technology Stack

**Frontend:**
- **Framework:** React 18, Vite
- **Styling:** Tailwind CSS, PostCSS
- **State Management:** Redux Toolkit, React-Redux
- **Routing:** React Router DOM
- **Animations:** Framer Motion
- **Icons:** React Icons
- **Swiper:** For modern carousels

**Backend:**
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database / Auth:** Firebase Admin, Firestore (migrating away from legacy MongoDB).
- **Other utilities:** Cloudinary (Image storage), Razorpay (Payments processing).

## 🚀 Getting Started

To run this project locally on your machine, follow these steps:

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn
- A Firebase project with Authentication and Firestore enabled

### 1. Clone & Install Dependencies

Open your terminal and install dependencies for both the frontend and backend.

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 2. Environment Variables Setup

You'll need to set up environment variables for both the backend and frontend.

**Backend (`backend/.env`):**
Create a `.env` file in the `backend/` directory. Use the `.env.example` as a reference. You must include your Firebase Service Account JSON details stringified or formatted correctly to enable Firebase Admin securely.
```env
PORT=5000
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
# Legacy Mongo URI (if some legacy services still need it)
MONGO_URI=your_mongo_uri
```

**Frontend (`frontend/.env`):**
Create a `.env` file in the `frontend/` directory to connect with your Firebase project and backend API.
```env
VITE_API_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Running the Application Locally

Start both frontend and backend development servers.

```bash
# In the backend directory
npm run dev

# In a new terminal, in the frontend directory
npm run dev
```

The frontend should now be running at `http://localhost:5173` and the backend on `http://localhost:5000`.

## 📦 Deployment Instructions

### Frontend (GitHub Pages)
The frontend is configured to be deployed easily to GitHub Pages. Ensure you have committed your changes before running the deploy script.
```bash
cd frontend
npm run deploy
```

### Backend
The backend can be freely deployed to platforms like Docker, Render, or Heroku (A `render.yaml` and `docker-compose.yml` are provided in the root). Ensure you configure all corresponding environment variables in your deployment platform's settings. 

## 📝 Status
This project has recently been migrated to Firebase for authentication, eliminating the strict dependency on a local MongoDB instance. Work is ongoing to migrate full user and legacy data to Firestore.
