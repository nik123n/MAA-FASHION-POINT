import { logEvent as firebaseLogEvent } from 'firebase/analytics';
import { analytics } from '../firebase/config';

const safeLog = (eventName, params = {}) => {
  if (analytics) {
    try {
      firebaseLogEvent(analytics, eventName, params);
    } catch (err) {
      // Silently fail — analytics should never break the app
      console.warn('[Analytics] Event failed:', eventName, err.message);
    }
  }
};

// ── Event Helpers ─────────────────────────────────────────────────────────────
export const trackProductView = (product) => {
  safeLog('view_item', {
    currency: 'INR',
    value: product.discountedPrice || product.price,
    items: [{
      item_id: product._id,
      item_name: product.name,
      item_category: product.category,
      price: product.discountedPrice || product.price,
    }],
  });
};

export const trackAddToCart = (product, quantity = 1) => {
  safeLog('add_to_cart', {
    currency: 'INR',
    value: (product.discountedPrice || product.price) * quantity,
    items: [{
      item_id: product._id,
      item_name: product.name,
      item_category: product.category,
      quantity,
      price: product.discountedPrice || product.price,
    }],
  });
};

export const trackPurchase = (order) => {
  safeLog('purchase', {
    transaction_id: order.orderNumber || order._id,
    currency: 'INR',
    value: order.pricing?.total || 0,
    tax: order.pricing?.tax || 0,
    shipping: order.pricing?.shipping || 0,
    coupon: order.coupon?.code || '',
    items: (order.items || []).map((item) => ({
      item_id: item.productId,
      item_name: item.name,
      quantity: item.quantity,
      price: item.price,
    })),
  });
};

export const trackSearch = (searchQuery) => {
  safeLog('search', { search_term: searchQuery });
};

export const trackPageView = (pageName) => {
  safeLog('page_view', { page_title: pageName });
};
