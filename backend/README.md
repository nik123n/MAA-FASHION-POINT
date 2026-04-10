# MAA Fashion Point - Backend Ecosystem 🚀

An enterprise-grade, high-performance, and deeply personalized e-commerce backend driving the "MAA Fashion Point" platform. This architecture relies on an advanced microservice and serverless-integrated design, leveraging cutting-edge integrations spanning from machine-learning-driven recommendations to dynamic image optimization.

## 🛠️ Tech Stack & Integrations

* **Core Backend:** Node.js, Express.js (Dockerized)
* **Databases:** Firebase Firestore (NoSQL), Upstash Redis (Caching)
* **User Authentication:** Firebase Admin SDK / Zero Trust Architecture
* **Machine Learning:** FastAPI (Python) for Item-Item Collaborative Filtering
* **Media Management:** Cloudinary (Dynamic Optimization & Storage)
* **Deployment Infrastructure:** Render (Backend/ML) + Vercel (Frontend)

---

## 🔐 Environment Variables

Environment variables perfectly map external cloud services into your application. Create a `.env` file at the root of your `backend` directory.

### `.env` File Template:

```env
# ──────────────────────
# CORE ENVIRONMENT
# ──────────────────────
NODE_ENV=development
PORT=5000

# ──────────────────────
# FRONTEND CONNECTION
# ──────────────────────
# The URL of your deployed React application to bypass CORS policies
FRONTEND_URL=https://maa-fashion-point.vercel.app

# ──────────────────────
# FIREBASE ADMIN SDK
# ──────────────────────
# Stringified JSON credentials for system-to-database communication
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"maa-fashtion-point","private_key_id":"xxxxxxxxxx","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxx.iam.gserviceaccount.com","universe_domain":"googleapis.com"}

# ──────────────────────
# CLOUDINARY MEDIA
# ──────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ──────────────────────
# REDIS (UPSTASH)
# ──────────────────────
# For production-grade caching endpoints and memory storage
UPSTASH_REDIS_REST_URL=https://up-redis-server.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# ──────────────────────
# MACHINE LEARNING
# ──────────────────────
# Link to your deployed Python FastAPI Recommendation Engine
ML_SERVICE_URL=https://maa-ml-service.onrender.com
```

### ⚠️ How to Format Firebase Configurations

Render does NOT cleanly accept raw JSON files as environment variables without complex setups. 
To feed your `FIREBASE_SERVICE_ACCOUNT`:
1. Generate the Server Admin SDK file (`serviceAccountKey.json`) from the Firebase Dashboard (Project Settings > Service Accounts).
2. Use an online JSON stringifier (or `JSON.stringify(require('./serviceAccountKey.json'))` in Node) to convert the entire file output into a **single line string**.
3. Paste that raw single line into the Render Dashboard as the `FIREBASE_SERVICE_ACCOUNT` value.

---

## 💻 Local Setup

1. **Navigate to backend:**
   ```bash
   cd backend
   ```
2. **Install exact module dependencies (legacy enabled):**
   ```bash
   npm install --legacy-peer-deps
   ```
3. **Set up `.env`:** Copy the template above into `.env` and fill the variables.
4. **Boot local server:**
   ```bash
   npm run dev
   ```

---

## 🛳️ Deployment (Render via Docker)

This application is strictly built to compile through Docker on a robust cloud platform like Render.

**1. Prepare Your Codebase**
Make sure all code is pushed securely to your `main` GitHub branch.

**2. Connect to Render**
- Create a new **Web Service** on Render.com.
- Connect your GitHub Repository.
- Select the `backend` folder as your **Root Directory**.
- **Environment:** Select `Docker` (Render will automatically detect your `Dockerfile`).

**3. Inject Context Variables**
Under the "Environment" tab, meticulously add all variables specified in the template above. Copy your single-line string for `FIREBASE_SERVICE_ACCOUNT` carefully!

**4. Deploy!**
Hit **Manual Deploy** or allow push-to-deploy to construct the Docker nodes.

---

## 🔌 Core API Endpoints

A quick overview of what the API exposes:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Deep connectivity health check (Bypassing external auth). |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profiles from token intercepts. |
| `GET` | `/api/v1/products` | Paginated product queries. |
| `GET` | `/api/v1/recommendations` | Intersects User -> ML Application -> Redis cache maps. |
| `POST` | `/api/v1/cart` | Mutate and persist shopping states securely. |
| `POST` | `/api/v1/activity` | Pipe frontend view/click analytics securely to Firestore. |

---

## 🚨 Troubleshooting & Common Errors

* **`ERESOLVE` Dependency Conflicts:**
  If your Docker build crashes demanding specific `cloudinary` versions, the container relies on strict semver matching (`1.x.x`). The `Dockerfile` natively circumvents this utilizing `npm install --legacy-peer-deps`. 
* **Cloudinary Upload "Missing Config":**
  If images fail to upload, review your `.env` values. E-commerce uploads bypass the backend disk and tunnel straight to the Cloudinary cloud via `multer-storage-cloudinary`. Both keys must perfectly align.
* **Firebase \`app/no-app\` Error:**
  Ensure the `FIREBASE_SERVICE_ACCOUNT` string perfectly matches standard JSON formats. Extraneous white spaces or broken strings render the initialization entirely unreadable!

---

### 🛡️ Security Guidelines
**Zero Trust Architecture:** Do not store admin statuses or security variables directly in public Firestore blobs! They are tracked via Admin SDK `customClaims`.
**Never Push Secrets:** Your `.env` and `serviceAccountKey.json` files must remain strictly listed in `.gitignore`.
