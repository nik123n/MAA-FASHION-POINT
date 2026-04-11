import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
import firebase_admin
from firebase_admin import credentials, firestore
import pickle
import os
import sys

def initialize_firebase():
    """Initialize Firebase Admin SDK using serviceAccountKey.json"""
    if not firebase_admin._apps:
        try:
            # Check if file exists in current directory
            cred_path = os.path.join(os.path.dirname(__file__), 'serviceAccountKey.json')
            if not os.path.exists(cred_path):
                print(f"Error: {cred_path} not found.")
                print("Please place your Firebase serviceAccountKey.json inside the ml_service folder.")
                sys.exit(1)
                
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            print("Firebase initialized successfully using serviceAccountKey.json.")
        except Exception as e:
            print(f"Error initializing Firebase: {e}")
            sys.exit(1)

def fetch_data():
    """Fetch user activity from Firestore"""
    db = firestore.client()
    data = []
    
    # We query the collection group 'activity' -> users/{userId}/activity
    activity_ref = db.collection_group('activity')
    docs = activity_ref.stream()
    
    for doc in docs:
        row = doc.to_dict()
        data.append({
            'userId': row.get('userId'),
            'productId': row.get('productId'),
            'action': row.get('action'),
            'timestamp': row.get('timestamp')
        })
    return pd.DataFrame(data)

def compute_similarity(df):
    """Calculate User-Product Matrix and compute Cosine Similarity"""
    if df.empty:
        print("No data available to train the model.")
        return None, None

    # Define weights for actions
    weights = {'view': 1, 'click': 2, 'cart': 3, 'purchase': 5}
    df['weight'] = df['action'].map(weights).fillna(0)
    
    # Sum the weights if user interacted with a product multiple times
    grouped = df.groupby(['userId', 'productId'])['weight'].sum().reset_index()
    
    # Create the user-item matrix
    user_item_matrix = grouped.pivot(index='userId', columns='productId', values='weight').fillna(0)
    
    # Compute Item-Item cosine similarity (Transpose because we want product similarities)
    # Using item-based CF is generally better for e-commerce than user-based
    item_similarity = cosine_similarity(user_item_matrix.T)
    
    # Create a DataFrame for the similarity matrix
    item_similarity_df = pd.DataFrame(
        item_similarity,
        index=user_item_matrix.columns,
        columns=user_item_matrix.columns
    )
    
    return user_item_matrix, item_similarity_df

def main():
    print("Initializing Firebase...")
    initialize_firebase()
    
    print("Fetching activity data...")
    df = fetch_data()
    print(f"Fetched {len(df)} interaction records.")
    
    print("Training model...")
    user_item_matrix, item_similarity_df = compute_similarity(df)
    
    if item_similarity_df is not None:
        # Save models to be used by the FastAPI service
        model_data = {
            'user_item_matrix': user_item_matrix,
            'item_similarity_df': item_similarity_df
        }
        
        with open('model.pkl', 'wb') as f:
            pickle.dump(model_data, f)
            
        print("Model trained and saved to model.pkl successfully!")

if __name__ == '__main__':
    main()
