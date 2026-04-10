const express = require('express');
const router = express.Router();
const { verifyFirebaseToken, requireAdmin } = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validate');
const {
  getAnalytics, getUsers, toggleUser, deleteUser,
  getAdminOrders, addOfflineSale, getAuditLogs,
} = require('../controllers/adminController');
const { assignRole, getUserClaims } = require('../controllers/roleController');

// All admin routes require auth + admin claim
router.use(verifyFirebaseToken, requireAdmin);

// Analytics
router.get('/analytics', getAnalytics);

// User management
router.get('/users', getUsers);
router.patch('/users/:id/toggle', toggleUser);
router.delete('/users/:id', deleteUser);

// Role management (custom claims)
router.post('/roles/assign', validate(schemas.assignRole), assignRole);
router.get('/roles/:uid', getUserClaims);

// Orders
router.get('/orders', getAdminOrders);

// Offline sales
router.post('/offline-sale', validate(schemas.offlineSale), addOfflineSale);

// Audit logs
router.get('/audit-logs', getAuditLogs);

module.exports = router;
