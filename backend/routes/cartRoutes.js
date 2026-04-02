const { cartRouter, orderRouter, paymentRouter, adminRouter, wishlistRouter, couponRouter } = require('./allRoutes');
// re-export each for clean server.js imports
module.exports = cartRouter;
