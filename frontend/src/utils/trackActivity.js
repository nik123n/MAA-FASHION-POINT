import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';

const trackActivity = async (productId, action, category = 'unknown') => {
  try {
    const user = auth.currentUser;
    const userId = user ? user.uid : 'anonymous';

    const activityData = {
      userId,
      productId,
      action,
      category,
      timestamp: Date.now()
    };

    const docRef = await addDoc(collection(db, 'activity'), activityData);
    console.log('Activity logged successfully with ID:', docRef.id, activityData);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

export default trackActivity;
