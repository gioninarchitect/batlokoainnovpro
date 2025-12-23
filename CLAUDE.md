# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development server (always port 5173)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint
npm run lint

# Kill stuck dev server
pkill -f "vite"
```

## Architecture

This is a 3D-enhanced React website for Batlokoa Innovative Projects, an industrial engineering supply company.

### Tech Stack
- React 18 + Vite 6
- Three.js + React Three Fiber (3D scenes)
- Framer Motion + GSAP (animations)
- Tailwind CSS (styling)
- React Hook Form + Zod (form validation)

### Import Aliases
Defined in `config/vite.config.js`:
- `@` → `src/`
- `@components` → `src/components/`
- `@ui` → `src/components/ui/`
- `@3d` → `src/components/3d/`
- `@sections` → `src/components/sections/`
- `@layout` → `src/components/layout/`
- `@hooks` → `src/hooks/`
- `@utils` → `src/utils/`
- `@data` → `src/data/`
- `@pages` → `src/pages/`

### Component Organization
- `components/3d/` - Three.js scenes (IndustrialScene.jsx is the main hero)
- `components/layout/` - Header, Footer, Layout wrapper, MobileMenu
- `components/ui/` - Reusable primitives (Button, Card, Badge) with barrel export
- `components/sections/` - Page-specific sections organized by route (home/, about/, etc.)
- `pages/` - Route components that compose sections
- `data/` - Static data (products.js, blogPosts.js)

### 3D Strategy
3D elements appear in 4 locations only:
1. Hero scene (homepage) - gears, particles, bolts
2. Product cards (hover effect) - NOT YET BUILT
3. About timeline (scroll-triggered) - NOT YET BUILT
4. Contact globe - NOT YET BUILT

No 3D on: blog pages, footer, mobile below 768px.

### Config Files Location
- `postcss.config.js` - **MUST be in root** (Vite requirement)
- `tailwind.config.js` - **MUST be in root** (PostCSS requirement)
- `config/vite.config.js` - Vite config with aliases and chunking

### Design System
See `docs/DESIGN_SYSTEM.md` for approved colors, typography, and component specs.

Key colors in Tailwind config:
- `navy` (#1a1a2e) - primary dark
- `industrial` (#0f3460) - links, accents
- `safety` (#e94560) - CTAs, highlights
- `gold` (#d4af37) - badges, premium elements

### Build Chunking
Vite splits into vendor chunks:
- `react-vendor` - React, React DOM, React Router
- `three-vendor` - Three.js, R3F, Drei
- `animation-vendor` - Framer Motion, GSAP

## Backend Configuration

### Ports - FIXED, NEVER CHANGE
- **Frontend (Vite):** 5173
- **Backend (Express):** 3016

### API Base URL
All frontend files use dynamic detection:
```javascript
const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3016/api/v1'
  : `${window.location.origin}/api/v1`
```

### Database
- PostgreSQL with Prisma ORM
- Schema: `backend/prisma/schema.prisma`
- Migrations: `backend/prisma/migrations/`

## Credentials - SOURCE OF TRUTH

**ALWAYS check `backend/prisma/seed.js` for current credentials. NEVER assume or use old values.**

### Admin Login (from seed.js)
- Email: `admin@batlokoainnovpro.co.za`
- Password: `Admin@2026!`

### Staff Login (from seed.js)
- Email: `staff@batlokoa.co.za`
- Password: `Staff@123!`

### Demo Customer (from seed.js)
- Email: `demo@engineering.co.za`
- Company: Demo Engineering (Pty) Ltd

## Backend Structure

```
backend/
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── seed.js            # CREDENTIALS SOURCE OF TRUTH
│   └── migrations/
├── src/
│   ├── server.js          # Express entry point
│   ├── routes/            # API route definitions
│   ├── controllers/       # Business logic
│   ├── middleware/
│   │   └── auth.js        # JWT authentication
│   └── services/
│       ├── pdf.service.js
│       ├── email.service.js
│       └── notification.service.js
└── assets/
    └── logo.png           # Company logo for PDFs
```

## Admin System Modules

1. Dashboard - Stats, alerts, quick actions
2. Products - CRUD, inventory, categories
3. Orders - Full lifecycle, POP approval, dispatch
4. Quotes - Create, send, convert to order
5. Invoices - Generate from orders, payments
6. Customers - CRM with lead scoring
7. Categories - Product organization
8. Suppliers - Supplier management
9. Purchase Orders - Procurement workflow
10. Settings - Company configuration
11. Audit Log - Activity tracking
12. Reports - Business analytics

## Customer Portal

- URL: `/portal/login`
- Customers can view their orders, quotes, invoices
- Separate authentication context from admin

## User Preferences

- Never use emojis
- Always use port 5173 for frontend, 3016 for backend - NEVER change these
- Verify site works before claiming complete
- No broken sites - test thoroughly
- ALWAYS check source files for credentials, NEVER assume from memory
- When updating documentation, verify values from actual code first

## Feature Consistency Rules

**CRITICAL: When implementing features in one area, apply consistently to related areas.**

### Dark Mode Implementation
- Both Admin (`/admin`) and Customer Portal (`/portal`) MUST have dark mode
- Uses `ThemeContext` from `@/context/ThemeContext`
- Pattern: `${darkMode ? 'dark-class' : 'light-class'}`
- Dark backgrounds: `bg-navy`, `bg-navy-dark`, `bg-gray-800`
- Light backgrounds: `bg-white`, `bg-gray-50`
- Dark text: `text-white`, `text-gray-300`, `text-gray-400`
- Light text: `text-gray-900`, `text-gray-700`, `text-gray-500`

### Accessibility Rules
- Dark theme = Light fonts (white, gray-300)
- Light theme = Dark fonts (gray-900, gray-700)
- Sufficient contrast is non-negotiable

### Portal Components with Dark Mode
- `PortalLayout.jsx` - Main layout wrapper
- `Dashboard.jsx` - Stats, cards, quick actions
- `Orders.jsx` - List and detail views
- `Profile.jsx` - All three tabs (Profile, Address, Security)
- `Quotes.jsx` and `Invoices.jsx` - Follow same pattern

## Deployment Rules

### Server Details
- **Domain:** batlokoa.cleva-ai.co.za
- **Backend Port:** 3016
- **Nginx root:** /var/www/batlokoa/frontend/dist

### Deployment Commands
**ALWAYS verify nginx config FIRST before deploying:**
```bash
ssh root@batlokoa.cleva-ai.co.za "cat /etc/nginx/sites-enabled/batlokoa | grep root"
```

**Frontend deployment (after npm run build):**
```bash
scp -r dist/* root@batlokoa.cleva-ai.co.za:/var/www/batlokoa/frontend/dist/
```

### NEVER DO THIS
- Deploy to wrong path (e.g., /var/www/batlokoa/frontend/ instead of /var/www/batlokoa/frontend/dist/)
- Assume deployment paths without checking nginx config
- Deploy backend without including all necessary files
