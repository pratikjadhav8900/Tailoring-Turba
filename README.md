# 👕 KraftX - Custom Garment Design Platform

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-blue?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Prisma-2A2F5E?logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Cloudinary-F24E1E?logo=cloudinary&logoColor=white" alt="Cloudinary" />
</div>

A modern, responsive web application for custom garment design and ordering. Built with Next.js 14, TypeScript, and Tailwind CSS, KraftX allows users to design custom clothing with real-time preview, fabric selection, and seamless ordering experience.

## ✨ Features

### 🎨 **Design Tools**
- **Live Customizer**: Real-time garment design with drag-and-drop functionality
- **Fabric Selection**: 30+ premium fabrics with detailed specifications
- **Color Customization**: Full color palette with live preview
- **Text & Logo Upload**: Add custom text and upload logos/images
- **Canva-like Interface**: Intuitive double-click to edit, single-click to drag

### 🛒 **E-commerce Features**
- **Product Catalog**: Browse and filter garments by category
- **Shopping Cart**: Persistent cart with quantity management
- **Secure Checkout**: Stripe integration for payment processing
- **Order Management**: Track orders and view order history

### 👥 **User Management**
- **Authentication**: Secure login/registration with NextAuth
- **Dashboard**: User profiles and order tracking
- **Admin Panel**: Order management and analytics
- **Responsive Design**: Mobile-first approach with touch support

### 🎯 **Business Features**
- **Bulk Ordering**: Wholesale pricing for large orders
- **Design Templates**: Pre-made design templates
- **Production Tracking**: Real-time order status updates
- **Customer Support**: Integrated chat and contact forms

## 🚀 Tech Stack

```typescript
// Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- React Hook Form + Zod
- React RND (Drag & Drop)

// Backend
- Next.js API Routes
- Prisma ORM
- PostgreSQL Database
- NextAuth.js
- Stripe Payment

// Infrastructure
- Vercel Hosting
- Cloudinary (Media)
- HubSpot (CRM)
```

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/pratikjadhav8900/Tailoring-Turba.git
cd Tailoring-Turba
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Environment Setup**
```bash
cp .env.example .env
# Configure your database URLs and API keys
```

4. **Database Setup**
```bash
npx prisma migrate dev
npx prisma generate
```

5. **Run Development Server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
kraftx/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── (auth)/          # Authentication routes
│   │   ├── admin/            # Admin dashboard
│   │   ├── api/              # API routes
│   │   ├── create/           # Design creation flow
│   │   ├── customizer/       # Live garment designer
│   │   └── dashboard/        # User dashboard
│   ├── components/           # Reusable React components
│   │   ├── admin/            # Admin components
│   │   ├── customizer/       # Design tools
│   │   └── landing/           # Landing page sections
│   ├── context/              # React context providers
│   ├── lib/                 # Utility functions
│   └── types/               # TypeScript type definitions
├── public/                 # Static assets
├── prisma/                # Database schema
└── docs/                   # Documentation
```

## 🎨 Design System

### Color Palette - "Sunset Creative"
```css
--color-primary-500: #F59E0B  /* Main Orange */
--color-primary-600: #D97706  /* Dark Orange */
--color-primary-700: #B45309  /* Darker Orange */
--color-accent-500: #10B981   /* Teal Accent */
--color-neutral-0: #FFFFFF    /* White */
--color-neutral-50: #F9FAFB   /* Light Gray */
--color-neutral-100: #F3F4F6  /* Medium Light Gray */
```

### Component Library
- **Buttons**: Consistent styling with hover states
- **Cards**: Glass morphism effects
- **Forms**: Validation and error handling
- **Modals**: Responsive overlays
- **Navigation**: Mobile-friendly menus

## 🔧 Development

### Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript validation
```

### Environment Variables
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
STRIPE_SECRET_KEY="..."
STRIPE_PUBLISHABLE_KEY="..."
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
```

## 📱 Mobile Responsiveness

KraftX is built mobile-first with responsive breakpoints:

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px

### Touch Support
- Optimized drag-and-drop for touch devices
- Touch-friendly button sizes (44px+)
- Swipe gestures for image galleries

## 🔒 Security Features

- **Authentication**: JWT-based with NextAuth
- **Input Validation**: Zod schemas for all forms
- **CSRF Protection**: Built-in Next.js middleware
- **Rate Limiting**: API endpoint protection
- **HTTPS**: SSL certificates enforced

## 📊 Performance

### Optimizations
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automatic route-based splitting
- **Lazy Loading**: Components and images
- **Caching**: Database query optimization
- **Bundle Analysis**: Regular size monitoring

### Metrics
- **Lighthouse Score**: 95+ Performance
- **Core Web Vitals**: Optimized for all metrics
- **Bundle Size**: < 500KB (gzipped)

## 🚀 Deployment

### Production
```bash
npm run build
npm start
```

### Vercel (Recommended)
1. Connect GitHub repository to Vercel
2. Configure environment variables
3. Automatic deployment on push to main

### Docker
```bash
docker-compose up -d
```

## 🧪 Testing

### Test Suite
```bash
npm run test          # Unit tests
npm run test:e2e      # End-to-end tests
npm run test:coverage  # Coverage report
```

### Test Coverage
- **Unit Tests**: 85%+ coverage
- **E2E Tests**: Critical user flows
- **Visual Regression**: Screenshot comparison
- **Performance**: Lighthouse CI testing

## 📚 API Documentation

### Key Endpoints
- `/api/auth/[...nextauth]` - Authentication
- `/api/upload` - File uploads
- `/api/orders` - Order management
- `/api/products` - Product catalog
- `/api/catalogue` - Fabric database

### Authentication Flow
- OAuth providers (Google, GitHub)
- Email/password authentication
- Session management
- Role-based access control

## 🤝 Contributing

We welcome contributions! Please follow our guidelines:

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Style
- Use TypeScript for all new code
- Follow ESLint configuration
- Write meaningful commit messages
- Include tests for new features

### Guidelines
- **Bug Reports**: Use GitHub Issues with detailed reproduction steps
- **Feature Requests**: Open Issue with "Enhancement" label
- **Pull Requests**: Ensure all tests pass before merging

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋 Support

- **Documentation**: Check our [Wiki](https://github.com/pratikjadhav8900/Tailoring-Turba/wiki)
- **Issues**: [GitHub Issues](https://github.com/pratikjadhav8900/Tailoring-Turba/issues)
- **Discussions**: [GitHub Discussions](https://github.com/pratikjadhav8900/Tailoring-Turba/discussions)
- **Email**: support@kraftx.com

---

<div align="center">
  <strong>Built with ❤️ for the custom garment industry</strong>
</div>
