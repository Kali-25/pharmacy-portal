# Pharmacy Portal

A full-featured pharmacy management system with advanced dashboards, inventory tracking, expiry monitoring, POS with patient details, role-based authentication, and a 3D animated landing page.

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js (App Router) | 15.x |
| Language | TypeScript | 5.6+ |
| UI Library | React | 19.x |
| Styling | Tailwind CSS | 3.4+ |
| Animations | Framer Motion | 12.x |
| Charts | Recharts | 2.15+ |
| Icons | Lucide React | 0.460+ |
| Database | PostgreSQL (Neon) | - |
| ORM | Prisma | 6.x |
| Auth | JWT (jose) + bcryptjs | - |
| Hosting | Vercel | - |
| Database Hosting | Neon | - |

## Features

### Dashboard
- Real-time KPI cards (total medicines, stock units, inventory value, monthly revenue)
- Inventory health ring with SVG animation
- Sales trend chart (last 7 days)
- Stock distribution chart by category
- Expiry timeline with 5-tier color-coded status
- Top-selling medicines leaderboard
- Recent transactions feed
- Low-stock alerts panel

### Inventory Management
- Searchable and filterable medicine table
- Add new medicines with initial batch support
- Edit medicines with full audit history (admin only)
- Track batches, suppliers, reorder levels
- Stock status badges (in-stock, low-stock, out-of-stock)

### Expiry Tracking
- 5-tier expiry status system (expired, critical, warning, notify, safe)
- Financial impact banner showing at-risk inventory value
- FIFO (First In First Out) batch recommendations
- Batch-level expiry dates with days remaining

### Point of Sale (POS)
- Medicine search with real-time filtering
- Automatic FIFO batch selection (oldest expiry first)
- Cart management with quantity adjustments
- Patient details capture (name + mobile mandatory, age/gender/email optional)
- Automatic invoice number generation
- Stock decrement with StockMovement logging
- Tax and discount calculations

### Authentication & Authorization
- JWT-based auth with HTTP-only cookies
- Password hashing with bcryptjs
- Role-based access control (ADMIN, PHARMACIST, TECHNICIAN, CASHIER)
- Protected routes via Next.js middleware
- Admin-only user management (create users with roles)
- Admin-only audit history for medicine edits

### Landing Page
- 3D tilt card with mouse-tracking rotation
- Floating dashboard preview with depth layers
- Animated counters with scroll triggers
- Floating pill background animations
- Gradient text and call-to-action sections

## Prerequisites

- Node.js 18+ (recommended 20+)
- npm or yarn
- A Neon PostgreSQL database (free at [neon.tech](https://neon.tech))

## Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/pharmacy-portal.git
   cd pharmacy-portal
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your Neon database URLs and JWT secret:
   ```env
   DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
   DIRECT_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
   JWT_SECRET="your-secure-random-string"
   ```
   Generate a JWT secret with:
   ```bash
   openssl rand -base64 48
   ```

4. **Set up the database:**
   ```bash
   npm run db:setup
   ```
   This runs `prisma db push` (creates tables) and `tsx prisma/seed.ts` (inserts seed data).

5. **Start the dev server:**
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@pharmacy.com | admin123 |
| Pharmacist | pharmacist@pharmacy.com | pharma123 |
| Cashier | cashier@pharmacy.com | cashier123 |

> Change these passwords after first login in production.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon pooled connection string (PgBouncer) - used by the app at runtime |
| `DIRECT_URL` | Neon direct connection string - used by Prisma for migrations and db push |
| `JWT_SECRET` | Secret key for signing JWT tokens (generate with `openssl rand -base64 48`) |

## Deployment (Vercel + Neon)

### Step 1: Create a Neon Database
1. Go to [neon.tech](https://neon.tech) and sign up (free)
2. Create a new project
3. Copy both the **pooled** and **direct** connection strings

### Step 2: Push Schema and Seed Data
Run these once locally with your Neon credentials in `.env`:
```bash
npm run db:setup
```

### Step 3: Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/pharmacy-portal.git
git branch -M main
git push -u origin main
```

### Step 4: Deploy on Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel auto-detects Next.js (no build config needed)
4. Add environment variables in the Vercel dashboard:
   - `DATABASE_URL` = your Neon pooled connection string
   - `DIRECT_URL` = your Neon direct connection string
   - `JWT_SECRET` = your JWT secret
5. Click **Deploy**

Your app will be live at `https://your-project.vercel.app`.

> The `postinstall` script automatically runs `prisma generate` during the Vercel build.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema changes to database |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:setup` | Push schema + seed (full setup) |
| `npm run db:migrate:deploy` | Deploy pending migrations (production) |
| `npm run db:setup:prod` | Migrate + seed (production setup) |

## Project Structure

```
pharmacy-portal/
├── prisma/
│   ├── schema.prisma          # Database schema (10 models)
│   └── seed.ts                # Seed script with sample data
├── src/
│   ├── app/
│   │   ├── page.tsx           # Landing page (public)
│   │   ├── login/page.tsx     # Login page (public)
│   │   ├── (portal)/          # Protected route group
│   │   │   ├── layout.tsx     # Portal layout with sidebar + auth check
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   ├── inventory/     # Inventory list + add + edit
│   │   │   ├── expiry/        # Expiry tracking
│   │   │   ├── pos/           # Point of sale terminal
│   │   │   ├── suppliers/     # Supplier management
│   │   │   └── users/         # User management (admin only)
│   │   └── api/
│   │       ├── auth/          # Login + logout endpoints
│   │       ├── medicines/     # CRUD for medicines
│   │       ├── sales/         # POS sale transactions
│   │       └── users/         # User CRUD (admin)
│   ├── components/
│   │   ├── auth/              # Login form
│   │   ├── dashboard/         # Charts, KPIs, timelines
│   │   ├── home/              # 3D animated landing page
│   │   ├── inventory/         # Tables, edit form, audit history
│   │   ├── layout/            # Sidebar, page header
│   │   ├── pos/               # POS terminal
│   │   ├── ui/                # Reusable UI (Card, Badge, Button, Input)
│   │   └── users/             # User manager
│   ├── lib/
│   │   ├── auth.ts            # JWT auth utilities
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── format.ts          # Formatting utilities
│   │   └── utils.ts           # General utilities
│   └── middleware.ts          # Route protection + role-based access
├── .env.example               # Environment variable template
├── vercel.json                # Vercel deployment config
├── tailwind.config.ts         # Tailwind CSS config
└── package.json
```

## Database Models

- **User** - Auth users with roles (admin, pharmacist, cashier)
- **Category** - Medicine categories with parent-child hierarchy
- **Medicine** - Medicine catalog with stock tracking
- **Batch** - Individual batches with expiry dates and quantities
- **Supplier** - Supplier contacts and lead times
- **Customer** - Patient records with medical info
- **Sale** - Sales transactions with invoice numbers
- **SaleItem** - Individual line items in a sale
- **StockMovement** - Audit trail for stock changes
- **AuditLog** - Audit trail for medicine edits

## Design System

- **Primary:** Pharmacy Green (#15803D)
- **Secondary:** Trust Blue (#0369A1)
- **Typography:** Fira Sans (body) + Fira Code (data/numbers)
- **Accessibility:** WCAG-AAA contrast ratios
