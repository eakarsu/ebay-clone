const nodemailer = require('nodemailer');
const { pool } = require('../config/database');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Log email
const logEmail = async (userId, emailType, recipientEmail, subject, status, errorMessage = null) => {
  try {
    await pool.query(
      `INSERT INTO email_logs (user_id, email_type, recipient_email, subject, status, error_message)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, emailType, recipientEmail, subject, status, errorMessage]
    );
  } catch (error) {
    console.error('Error logging email:', error);
  }
};

// Send email
const sendEmail = async (to, subject, html, userId = null, emailType = 'general') => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"eBay Clone" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    await logEmail(userId, emailType, to, subject, 'sent');
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    await logEmail(userId, emailType, to, subject, 'failed', error.message);
    return false;
  }
};

// Email templates
const templates = {
  // Welcome email
  welcome: (user) => ({
    subject: 'Welcome to eBay Clone!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #e53238, #0064d2); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to eBay Clone!</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Hi ${user.firstName || user.username}!</h2>
          <p>Thanks for joining eBay Clone. You're now part of a community of millions of buyers and sellers.</p>
          <p>Here's what you can do:</p>
          <ul>
            <li>Browse millions of items</li>
            <li>Bid on auctions</li>
            <li>Buy it now</li>
            <li>Start selling your items</li>
          </ul>
          <a href="${process.env.FRONTEND_URL}" style="display: inline-block; background: #3665f3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin-top: 20px;">Start Shopping</a>
        </div>
        <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>© 2024 eBay Clone. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  // Email verification
  emailVerification: (user, token) => ({
    subject: 'Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #3665f3; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Verify Your Email</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Hi ${user.firstName || user.username}!</h2>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${process.env.FRONTEND_URL}/verify-email?token=${token}" style="display: inline-block; background: #3665f3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0;">Verify Email</a>
          <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
        </div>
      </div>
    `,
  }),

  // Password reset
  passwordReset: (user, token) => ({
    subject: 'Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #3665f3; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Password Reset</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Hi ${user.firstName || user.username}!</h2>
          <p>You requested to reset your password. Click the button below to create a new password:</p>
          <a href="${process.env.FRONTEND_URL}/reset-password?token=${token}" style="display: inline-block; background: #3665f3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0;">Reset Password</a>
          <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `,
  }),

  // Order confirmation
  orderConfirmation: (user, order, items) => ({
    subject: `Order Confirmed - ${order.order_number}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #86b817; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Order Confirmed!</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Thanks for your order, ${user.firstName || user.username}!</h2>
          <p><strong>Order Number:</strong> ${order.order_number}</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Order Summary</h3>
            ${items.map(item => `
              <div style="display: flex; padding: 10px 0; border-bottom: 1px solid #eee;">
                <div style="flex: 1;">
                  <strong>${item.title}</strong><br>
                  <span style="color: #666;">Qty: ${item.quantity}</span>
                </div>
                <div style="text-align: right;">$${item.total_price.toFixed(2)}</div>
              </div>
            `).join('')}
            <div style="padding-top: 15px; font-size: 18px; font-weight: bold;">
              Total: $${parseFloat(order.total).toFixed(2)}
            </div>
          </div>
          <a href="${process.env.FRONTEND_URL}/orders/${order.id}" style="display: inline-block; background: #3665f3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px;">View Order</a>
        </div>
      </div>
    `,
  }),

  // Order shipped
  orderShipped: (user, order, trackingNumber, carrier) => ({
    subject: `Your Order Has Shipped - ${order.order_number}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0064d2; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Your Order Has Shipped!</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Hi ${user.firstName || user.username}!</h2>
          <p>Great news! Your order is on its way.</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Order Number:</strong> ${order.order_number}</p>
            <p><strong>Carrier:</strong> ${carrier || 'Standard Shipping'}</p>
            <p><strong>Tracking Number:</strong> ${trackingNumber || 'Not available'}</p>
          </div>
          <a href="${process.env.FRONTEND_URL}/orders/${order.id}" style="display: inline-block; background: #3665f3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px;">Track Order</a>
        </div>
      </div>
    `,
  }),

  // Outbid notification
  outbid: (user, product, currentBid, productUrl) => ({
    subject: `You've Been Outbid on ${product.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #e53238; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">You've Been Outbid!</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Hi ${user.firstName || user.username}!</h2>
          <p>Someone has placed a higher bid on an item you're watching.</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${product.title}</h3>
            <p><strong>Current Bid:</strong> $${currentBid.toFixed(2)}</p>
          </div>
          <a href="${process.env.FRONTEND_URL}/product/${product.id}" style="display: inline-block; background: #3665f3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px;">Place New Bid</a>
        </div>
      </div>
    `,
  }),

  // Auction won
  auctionWon: (user, product, winningBid) => ({
    subject: `Congratulations! You Won ${product.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #86b817; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">You Won!</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Congratulations ${user.firstName || user.username}!</h2>
          <p>You've won the auction!</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${product.title}</h3>
            <p><strong>Winning Bid:</strong> $${winningBid.toFixed(2)}</p>
          </div>
          <a href="${process.env.FRONTEND_URL}/checkout?product=${product.id}" style="display: inline-block; background: #3665f3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px;">Complete Purchase</a>
        </div>
      </div>
    `,
  }),

  // Item sold (to seller)
  itemSold: (seller, product, buyer, price) => ({
    subject: `Your Item Sold - ${product.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #86b817; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Your Item Sold!</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Great news ${seller.firstName || seller.username}!</h2>
          <p>Your item has been sold!</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${product.title}</h3>
            <p><strong>Sold For:</strong> $${price.toFixed(2)}</p>
            <p><strong>Buyer:</strong> ${buyer.username}</p>
          </div>
          <a href="${process.env.FRONTEND_URL}/orders?type=sales" style="display: inline-block; background: #3665f3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px;">View Sales</a>
        </div>
      </div>
    `,
  }),

  // Dispute opened
  disputeOpened: (user, dispute, order) => ({
    subject: `Dispute Opened - Order ${order.order_number}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f5af02; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Dispute Opened</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Hi ${user.firstName || user.username}!</h2>
          <p>A dispute has been opened for order ${order.order_number}.</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Dispute Type:</strong> ${dispute.dispute_type.replace(/_/g, ' ')}</p>
            <p><strong>Reason:</strong> ${dispute.reason}</p>
          </div>
          <p>Please respond within 3 business days.</p>
          <a href="${process.env.FRONTEND_URL}/disputes/${dispute.id}" style="display: inline-block; background: #3665f3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px;">View Dispute</a>
        </div>
      </div>
    `,
  }),
};

// Export functions
module.exports = {
  sendEmail,
  sendWelcomeEmail: async (user) => {
    const template = templates.welcome(user);
    return sendEmail(user.email, template.subject, template.html, user.id, 'welcome');
  },
  sendVerificationEmail: async (user, token) => {
    const template = templates.emailVerification(user, token);
    return sendEmail(user.email, template.subject, template.html, user.id, 'verification');
  },
  sendPasswordResetEmail: async (user, token) => {
    const template = templates.passwordReset(user, token);
    return sendEmail(user.email, template.subject, template.html, user.id, 'password_reset');
  },
  sendOrderConfirmationEmail: async (user, order, items) => {
    const template = templates.orderConfirmation(user, order, items);
    return sendEmail(user.email, template.subject, template.html, user.id, 'order_confirmation');
  },
  sendOrderShippedEmail: async (user, order, trackingNumber, carrier) => {
    const template = templates.orderShipped(user, order, trackingNumber, carrier);
    return sendEmail(user.email, template.subject, template.html, user.id, 'order_shipped');
  },
  sendOutbidEmail: async (user, product, currentBid) => {
    const template = templates.outbid(user, product, currentBid);
    return sendEmail(user.email, template.subject, template.html, user.id, 'outbid');
  },
  sendAuctionWonEmail: async (user, product, winningBid) => {
    const template = templates.auctionWon(user, product, winningBid);
    return sendEmail(user.email, template.subject, template.html, user.id, 'auction_won');
  },
  sendItemSoldEmail: async (seller, product, buyer, price) => {
    const template = templates.itemSold(seller, product, buyer, price);
    return sendEmail(seller.email, template.subject, template.html, seller.id, 'item_sold');
  },
  sendDisputeOpenedEmail: async (user, dispute, order) => {
    const template = templates.disputeOpened(user, dispute, order);
    return sendEmail(user.email, template.subject, template.html, user.id, 'dispute_opened');
  },
};
