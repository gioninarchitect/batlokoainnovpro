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

## User Preferences

- Never use emojis
- Always use port 5173 - never start new ports
- Verify site works before claiming complete
- No broken sites - test thoroughly
