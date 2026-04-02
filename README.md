# MAA Fashion Point

This project uses React on the frontend and Node.js/Express on the backend.

Current backend status:
- Firebase Auth / Firebase Admin are enabled for authentication.
- The backend server no longer requires MongoDB to start.
- Some commerce APIs still contain legacy Mongo-based code and may need a full Firestore migration.

Deployment notes:
- Set `FIREBASE_SERVICE_ACCOUNT_JSON` on the backend.
- Set frontend Firebase client config in the Vite environment when needed.
- Set `VITE_API_URL` for production frontend builds.
