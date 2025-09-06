# EcoFinds - Sustainable Marketplace

A full-stack responsive web application for buying and selling eco-friendly products. Built with React, Express, and SQLite, designed for deployment on Vercel.

## 🌱 Features

### Core Functionality
- **User Authentication**: JWT-based login/register system
- **Product Management**: CRUD operations for product listings
- **Shopping Cart**: Add/remove items, quantity management
- **Order System**: Complete purchase flow with order tracking
- **Messaging**: Real-time chat between buyers and sellers
- **User Profiles**: Public profiles with product listings

### UI/UX Features
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Smooth Animations**: Framer Motion for enhanced user experience
- **Search & Filters**: Find products by category, price, and keywords
- **Customer Service Bot**: AI-powered chatbot for support

### Eco-Friendly Focus
- **Sustainable Categories**: Electronics, Clothing, Books, Furniture, etc.
- **Recycling Process**: Clear steps from collect → buy → recycle
- **Community Driven**: Connect eco-conscious buyers and sellers

## 🚀 Tech Stack

### Frontend
- **React 18** - UI framework
- **TailwindCSS** - Styling and responsive design
- **Framer Motion** - Animations and transitions
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

### Backend
- **Express.js** - Web framework
- **SQLite** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security headers

### Deployment
- **Vercel** - Hosting platform
- **Serverless Functions** - API routes

## 📁 Project Structure

```
ecofinds/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   └── App.js
│   └── package.json
├── api/                    # Express backend
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── database.js         # Database connection
│   └── index.js           # Server entry point
├── db/                     # Database files
│   ├── schema.sql          # Database schema
│   └── seed.sql           # Sample data
├── vercel.json            # Vercel configuration
└── package.json           # Root package.json
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ecofinds
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp api/env.example api/.env
   
   # Edit api/.env with your configuration
   JWT_SECRET=your-super-secret-jwt-key
   CLIENT_URL=http://localhost:3000
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

### Database Setup

The SQLite database will be automatically created and seeded when you start the backend server. The database file will be created at `db/ecofinds.db`.

## 🚀 Deployment on Vercel

### Prerequisites
- Vercel account
- Vercel CLI installed (`npm i -g vercel`)

### Deployment Steps

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**
   ```bash
   vercel
   ```

3. **Set environment variables in Vercel dashboard**
   - `JWT_SECRET`: Your secret key for JWT tokens
   - `NODE_ENV`: production

4. **Configure custom domain (optional)**
   - Add your domain in Vercel dashboard
   - Update DNS settings

### Vercel Configuration

The `vercel.json` file configures:
- API routes for serverless functions
- Static file serving for React build
- Environment variables
- Routing rules

## 📱 Usage

### For Buyers
1. **Browse Products**: Use search and filters to find items
2. **Add to Cart**: Add items to your shopping cart
3. **Checkout**: Complete purchases and track orders
4. **Message Sellers**: Chat with sellers about products

### For Sellers
1. **Create Account**: Register and verify your account
2. **List Products**: Add photos, descriptions, and pricing
3. **Manage Orders**: Track sales and update order status
4. **Chat with Buyers**: Answer questions and negotiate

### Demo Credentials
- **Email**: eco@example.com
- **Password**: password123

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Products
- `GET /api/products` - List products (with filters)
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/purchases` - Get user purchases
- `GET /api/orders/sales` - Get user sales
- `PUT /api/orders/:id/status` - Update order status

### Cart
- `GET /api/cart` - Get cart items
- `POST /api/cart/add` - Add to cart
- `PUT /api/cart/:productId` - Update quantity
- `DELETE /api/cart/:productId` - Remove from cart
- `POST /api/cart/checkout` - Checkout cart

### Messages
- `GET /api/messages/conversations` - Get conversations
- `GET /api/messages/:userId` - Get messages
- `POST /api/messages/send` - Send message
- `POST /api/messages/chatbot` - Chatbot endpoint

## 🎨 Customization

### Styling
- Modify `client/tailwind.config.js` for theme customization
- Update colors in `client/src/index.css`
- Add custom animations in Tailwind config

### Features
- Add new product categories in `db/seed.sql`
- Extend chatbot responses in `api/routes/messages.js`
- Add new API endpoints in `api/routes/`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Acknowledgments

- Icons by [Lucide](https://lucide.dev/)
- Images by [Unsplash](https://unsplash.com/)
- Built with ❤️ for the environment

## 📞 Support

For support, email support@ecofinds.com or use the in-app chat widget.

---

**EcoFinds** - Making sustainable living accessible to everyone! 🌱
