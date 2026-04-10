const express = require('express');
const router = express.Router();
const { verifyFirebaseToken, requireAdmin } = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validate');
const {
  placeOrder, getMyOrders, getOrder,
  getAllOrders, updateOrderStatus, cancelOrder,
} = require('../controllers/orderController');

// All order routes require auth
router.use(verifyFirebaseToken);

router.post('/', validate(schemas.placeOrder), placeOrder);
router.get('/my', getMyOrders);
router.get('/:id', getOrder);
router.put('/:id/cancel', validate(schemas.cancelOrder), cancelOrder);

// Admin only
router.get('/', requireAdmin, getAllOrders);
router.put('/:id/status', requireAdmin, validate(schemas.updateOrderStatus), updateOrderStatus);

module.exports = router;
