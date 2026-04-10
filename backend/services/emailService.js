const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendOrderConfirmationEmail = async (order) => {
  const itemRows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #f0e6ed;">${item.name} (${item.size})</td>
        <td style="padding:8px;border-bottom:1px solid #f0e6ed;text-align:center;">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #f0e6ed;text-align:right;">₹${(item.price * item.quantity).toLocaleString()}</td>
      </tr>`
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#fdf6f9;margin:0;padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <tr>
      <td style="background:linear-gradient(135deg,#c8496a,#e8789a);padding:40px 32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:2px;">SAANJH BOUTIQUE</h1>
        <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">✨ Order Confirmed!</p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;">
        <h2 style="color:#2d1b26;margin:0 0 8px;">Thank you, ${order.user.name}! 🎉</h2>
        <p style="color:#8b6070;">Your order <strong>#${order.orderNumber}</strong> has been placed successfully.</p>

        <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border:1px solid #f0e6ed;border-radius:8px;overflow:hidden;">
          <thead>
            <tr style="background:#fdf2f6;">
              <th style="padding:12px;text-align:left;color:#8b6070;font-size:13px;">ITEM</th>
              <th style="padding:12px;text-align:center;color:#8b6070;font-size:13px;">QTY</th>
              <th style="padding:12px;text-align:right;color:#8b6070;font-size:13px;">AMOUNT</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #f0e6ed;padding-top:16px;">
          <tr>
            <td style="color:#8b6070;padding:4px 0;">Subtotal</td>
            <td style="text-align:right;color:#2d1b26;">₹${order.pricing.subtotal.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="color:#8b6070;padding:4px 0;">Shipping</td>
            <td style="text-align:right;color:#2d1b26;">${order.pricing.shipping === 0 ? 'FREE' : '₹' + order.pricing.shipping}</td>
          </tr>
          ${order.pricing.discount > 0 ? `<tr><td style="color:#16a34a;padding:4px 0;">Discount</td><td style="text-align:right;color:#16a34a;">-₹${order.pricing.discount}</td></tr>` : ''}
          <tr>
            <td style="font-weight:bold;color:#2d1b26;padding:8px 0;font-size:18px;">Total</td>
            <td style="text-align:right;font-weight:bold;color:#c8496a;font-size:18px;">₹${order.pricing.total.toLocaleString()}</td>
          </tr>
        </table>

        <div style="margin-top:24px;padding:16px;background:#fdf2f6;border-radius:8px;">
          <p style="margin:0 0 8px;color:#8b6070;font-size:13px;">📦 DELIVERY ADDRESS</p>
          <p style="margin:0;color:#2d1b26;">${order.shippingAddress.fullName}<br>${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}</p>
        </div>

        <p style="margin-top:24px;color:#8b6070;font-size:13px;">Estimated delivery: <strong>${new Date(order.estimatedDelivery).toDateString()}</strong></p>
      </td>
    </tr>
    <tr>
      <td style="background:#fdf2f6;padding:24px;text-align:center;">
        <p style="color:#8b6070;font-size:13px;margin:0;">Questions? Email us at <a href="mailto:support@saanjhboutique.com" style="color:#c8496a;">support@saanjhboutique.com</a></p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: order.user.email,
    subject: `✅ Order Confirmed — #${order.orderNumber} | Saanjh Boutique`,
    html,
  });
};

// ── Low Stock Admin Alert ─────────────────────────────────────────────────────
const sendLowStockAlert = async (lowStockItems) => {
  if (!lowStockItems || lowStockItems.length === 0) return;
  if (!process.env.EMAIL_USER || !process.env.ADMIN_EMAIL) return;

  const rows = lowStockItems.map(({ name, size, stock }) =>
    `<tr>
      <td style="padding:8px;border-bottom:1px solid #fee2e2;">${name}</td>
      <td style="padding:8px;border-bottom:1px solid #fee2e2;text-align:center;">${size}</td>
      <td style="padding:8px;border-bottom:1px solid #fee2e2;text-align:center;color:#dc2626;font-weight:bold;">${stock} left</td>
    </tr>`
  ).join('');

  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#fff5f5;">
    <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
      <div style="background:#dc2626;padding:24px 32px;">
        <h2 style="color:#fff;margin:0;">⚠️ Low Stock Alert</h2>
        <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;">The following products need restocking</p>
      </div>
      <div style="padding:24px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #fee2e2;border-radius:8px;overflow:hidden;">
          <thead><tr style="background:#fef2f2;">
            <th style="padding:12px;text-align:left;color:#991b1b;font-size:13px;">PRODUCT</th>
            <th style="padding:12px;text-align:center;color:#991b1b;font-size:13px;">SIZE</th>
            <th style="padding:12px;text-align:center;color:#991b1b;font-size:13px;">STOCK</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="color:#6b7280;font-size:13px;margin-top:16px;">Please update inventory in the Admin Dashboard.</p>
      </div>
    </div>
  </body></html>`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: process.env.ADMIN_EMAIL,
    subject: `⚠️ Low Stock Alert — ${lowStockItems.length} item(s) need restocking`,
    html,
  });
};

module.exports = { sendOrderConfirmationEmail, sendLowStockAlert };
