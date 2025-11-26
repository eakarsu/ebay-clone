# eBay Clone - Professional Marketplace

A full-featured eBay clone built with React, Node.js, Express, and PostgreSQL. Features Material UI for a professional, responsive design.

## Features

### Core Functionality
- **User Authentication** - Register, login, profile management
- **Product Listings** - Create, edit, view products with multiple images
- **Categories & Subcategories** - Organized product browsing
- **Search & Filters** - Full-text search with price, condition, category filters
- **Auction System** - Place bids, auto-bidding, bid history
- **Buy It Now** - Instant purchase option
- **Shopping Cart** - Add items, update quantities, checkout
- **Order Management** - Track purchases and sales
- **Watchlist** - Save items for later
- **Reviews & Ratings** - Seller and product reviews
- **Messaging** - Buyer-seller communication
- **Notifications** - Real-time alerts for bids, orders, messages

### Technical Features
- RESTful API with Express.js
- PostgreSQL database with comprehensive schema
- JWT authentication
- Material UI components
- Responsive design
- Sample data seeding

## Prerequisites

- **Node.js** 18 or higher
- **PostgreSQL** 14 or higher (running locally)
- **npm** or **yarn**

## Quick Start

1. **Ensure PostgreSQL is running locally:**

   ```bash
   # macOS (Homebrew)
   brew services start postgresql@15

   # Ubuntu/Debian
   sudo systemctl start postgresql

   # Check if running
   psql -U postgres -c '\l'
   ```

2. **Run the start script:**

   ```bash
   ./start.sh
   ```

   This will:
   - Check PostgreSQL connection
   - Create the database if needed
   - Install dependencies
   - Seed sample data (optional)
   - Start both backend and frontend

3. **Open in browser:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Test Accounts

After seeding, use these accounts:

| Role | Email | Password |
|------|-------|----------|
| Buyer | jane@example.com | password123 |
| Seller | techdeals@example.com | password123 |

## Project Structure

```
ebay/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth, error handling
│   │   ├── routes/          # API routes
│   │   ├── database/        # Seed scripts
│   │   └── index.js         # Express app entry
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React context providers
│   │   ├── services/        # API service functions
│   │   └── App.js           # Main app component
│   └── package.json
├── database/
│   └── schema.sql           # PostgreSQL schema
├── start.sh                 # One-click start script
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in
- `GET /api/auth/profile` - Get profile
- `PUT /api/auth/profile` - Update profile

### Products
- `GET /api/products` - List products (with filters)
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create listing
- `PUT /api/products/:id` - Update listing
- `DELETE /api/products/:id` - Delete listing

### Categories
- `GET /api/categories` - List categories
- `GET /api/categories/with-subcategories` - Categories with subs
- `GET /api/categories/:slug` - Category details

### Bids
- `POST /api/bids` - Place bid
- `GET /api/bids/product/:id` - Product bid history
- `GET /api/bids/my-bids` - User's bids

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Order details
- `PUT /api/orders/:id/status` - Update order status

### Cart
- `GET /api/cart` - Get cart
- `POST /api/cart/add` - Add to cart
- `PUT /api/cart/item/:id` - Update quantity
- `DELETE /api/cart/item/:id` - Remove item

### Watchlist
- `GET /api/watchlist` - Get watchlist
- `POST /api/watchlist` - Add to watchlist
- `DELETE /api/watchlist/:productId` - Remove from watchlist

### Messages
- `GET /api/messages/conversations` - List conversations
- `GET /api/messages/:userId` - Get messages with user
- `POST /api/messages` - Send message

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read

## Database Schema

The PostgreSQL database includes:
- Users (authentication, profiles, seller stats)
- Products (listings with all eBay-like fields)
- Categories & Subcategories
- Product Images
- Bids (auction system)
- Orders & Order Items
- Shopping Carts
- Watchlist
- Reviews
- Messages
- Notifications
- Addresses
- Payment Methods

## Environment Variables

Create `.env` in the backend directory:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ebay_clone
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-secret-key
PORT=5000
```

## Manual Setup

If you prefer manual setup:

```bash
# Create database
psql -U postgres -c "CREATE DATABASE ebay_clone;"

# Setup backend
cd backend
cp .env.example .env
npm install
npm run seed  # Seed sample data
npm start

# Setup frontend (new terminal)
cd frontend
npm install
npm start
```

## Sample Data

The seed script creates:
- 10 users (8 sellers, 2 buyers)
- 10 categories with subcategories
- 35+ products across all categories
- Sample orders, reviews, bids, messages
- Notifications and watchlist items

Categories include:
- Electronics (phones, computers, cameras)
- Fashion (clothing, watches, shoes)
- Home & Garden
- Sports & Outdoors
- Collectibles & Art
- Books & Media
- And more...

## Technologies Used

**Backend:**
- Node.js & Express
- PostgreSQL
- JWT for authentication
- bcrypt for password hashing

**Frontend:**
- React 18
- Material UI (MUI) v5
- React Router v6
- Axios
- date-fns

## License

MIT License - Feel free to use for learning and projects.
