from fastapi import FastAPI, HTTPException, Query
import pickle
import pandas as pd
import os

app = FastAPI(title="MAA Fashion Point Recommendation API")

# Global variables to store our model data
user_item_matrix = None
item_similarity_df = None

@app.on_event("startup")
def load_model():
    global user_item_matrix, item_similarity_df
    try:
        if os.path.exists('model.pkl'):
            with open('model.pkl', 'rb') as f:
                model_data = pickle.load(f)
                user_item_matrix = model_data.get('user_item_matrix')
                item_similarity_df = model_data.get('item_similarity_df')
            print("Model loaded successfully.")
        else:
            print("Warning: model.pkl not found. Run train.py first.")
    except Exception as e:
        print(f"Failed to load model: {e}")

@app.get("/recommendations")
def get_recommendations(userId: str, limit: int = Query(10, ge=1, le=50), page: int = Query(1, ge=1)):
    """
    Get top N recommended product IDs for a given user.
    Uses Item-based collaborative filtering methodology.
    """
    if user_item_matrix is None or item_similarity_df is None:
        # Graceful degradation if model isn't trained yet
        return {"recommendations": []}

    try:
        # Check if user exists in the matrix (warm start)
        if userId in user_item_matrix.index:
            user_ratings = user_item_matrix.loc[userId]
            # Get products the user has already interacted with
            user_interacted_products = user_ratings[user_ratings > 0].index.tolist()
            
            # Predict scores for all products
            # This is a simplified dot-product similarity scoring
            predicted_scores = item_similarity_df.dot(user_ratings)
            
            # Remove products the user has already interacted with
            predicted_scores = predicted_scores.drop(user_interacted_products, errors='ignore')
            
            # Sort by highest score
            start_idx = (page - 1) * limit
            top_products = predicted_scores.sort_values(ascending=False).iloc[start_idx:start_idx+limit].index.tolist()
            
            return {"recommendations": top_products}
        else:
            # Cold start user (new user): recommend globally most popular products
            # As a proxy for 'popular', we can sum columns in user_item_matrix
            start_idx = (page - 1) * limit
            popular_products = user_item_matrix.sum(axis=0).sort_values(ascending=False).iloc[start_idx:start_idx+limit].index.tolist()
            return {"recommendations": popular_products}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "ok", "model_loaded": user_item_matrix is not None}
