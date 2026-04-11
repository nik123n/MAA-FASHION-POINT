# Machine Learning Recommendation System Setup Guide

Congratulations! All the backend controllers, routing, Python microservice code, and frontend components have been successfully written and integrated into your project.

Follow these steps to spin everything up and see your AI recommendations in action!

## Step 1: Install Python Dependencies
The machine learning system runs natively in Python using FastApi & Scikit-Learn.
1. Open a new terminal instance and navigate to the `ml_service` directory:
   ```bash
   cd "D:\My Project\maa\MAA FASHTION POINT\ml_service"
   ```
2. (Recommended) Create a virtual environment:
   ```bash
   python -m venv venv
   # On Windows Activate it:
   .\venv\Scripts\activate
   ```
3. Install the dependencies listed in the newly created `requirements.txt`:
   ```bash
   pip install -r requirements.txt
   ```

## Step 2: Ensure Firebase Access
Because the machine learning service requires access to the exact same Firestore database as your Node.js backend:
1. Ensure your system has the `GOOGLE_APPLICATION_CREDENTIALS` environment variable set to the absolute path of your `serviceAccountKey.json`.
   *Alternatively*, you can edit `ml_service/train.py` and replace `firebase_admin.initialize_app()` with `firebase_admin.initialize_app(credentials.Certificate('path/to/your/firebase-adminsdk.json'))`.

## Step 3: Train the Model (Optional initial run)
If you already have user activity in your database, train the ML model:
```bash
python train.py
```
*Note: If you have no data yet, `app.py` will automatically fall back to trending products. But it's good practice to run it to ensure no Firebase authentication errors arise.*

## Step 4: Run the Python API Layer
This will spin up the FastAPI service on `http://127.0.0.1:8000`:
```bash
uvicorn app:app --reload
```

## Step 5: Start the Node.js Backend & React Frontend
You should already have these running. Make sure your `backend/.env` contains the environment variables for Upstash Redis (which it seems it does) and optionally `ML_SERVICE_URL=http://127.0.0.1:8000`.

## Step 6: Plug the UI into the Frontend
I have built the `RecommendedProducts` infinite-scrolling component. Add it anywhere in your UI! For example, placing it at the bottom of the Home page or inside `ProductDetail.jsx`:

```jsx
import RecommendedProducts from '../components/product/RecommendedProducts';

function Home() {
   return (
     <div>
       {/* ... your marketing banners ... */}
       <RecommendedProducts />
     </div>
   )
}
```

## Step 7: Fire User Activity
To teach the AI what users like, call the tracking method wherever user actions take place (e.g., when viewing a product or clicking 'Add to Cart'):

```jsx
import trackActivity from '../utils/trackActivity';

// Inside your ProductCard or ProductView
const handleAddToCart = () => {
   trackActivity(product.id, 'cart', product.category);
   // ... rest of logic
}

useEffect(() => {
   // Assuming this is inside a single Product view
   trackActivity(product.id, 'view', product.category);
}, [product.id]);
```

### 🚀 Production Automation Tip
For a live environment, set up a cron job or a background task scheduler (like Node-cron or GitHub Actions) to execute `python train.py` every night at 2:00 AM. This guarantees that your recommendation model learns dynamically as orders and clicks happen during the day!
