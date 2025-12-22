# BATLOKOA PROJECT STRUCTURE

## Root Directory (Minimal - Only Essentials)

```
batlokoainnovpro/
│
├── public/                     # Static assets (copied as-is to build)
│   ├── favicon.ico
│   ├── robots.txt
│   └── sitemap.xml
│
├── src/                        # All source code
│   ├── components/             # Reusable components
│   │   ├── 3d/                 # Three.js / R3F components
│   │   │   ├── IndustrialScene.jsx      # Hero 3D scene
│   │   │   ├── ProductModel.jsx         # Reusable product 3D viewer
│   │   │   ├── ParticleSystem.jsx       # Industrial particles
│   │   │   ├── GlobeScene.jsx           # Contact page Earth
│   │   │   ├── TimelineScene.jsx        # About page timeline
│   │   │   └── models/                  # Individual 3D product models
│   │   │       ├── Bolt.jsx
│   │   │       ├── Pipe.jsx
│   │   │       ├── Drill.jsx
│   │   │       ├── HardHat.jsx
│   │   │       ├── Bearing.jsx
│   │   │       ├── Transformer.jsx
│   │   │       ├── PipeElbow.jsx
│   │   │       └── TissueRoll.jsx
│   │   │
│   │   ├── layout/             # Page structure components
│   │   │   ├── Header.jsx               # Navigation header
│   │   │   ├── Footer.jsx               # Site footer
│   │   │   ├── Layout.jsx               # Page wrapper
│   │   │   ├── MobileMenu.jsx           # Mobile navigation overlay
│   │   │   └── SkipLink.jsx             # Accessibility skip link
│   │   │
│   │   ├── ui/                 # Base UI components
│   │   │   ├── Button.jsx               # All button variants
│   │   │   ├── Card.jsx                 # Base card component
│   │   │   ├── ProductCard.jsx          # Product category card
│   │   │   ├── BlogCard.jsx             # Blog post card
│   │   │   ├── ServiceCard.jsx          # Service expandable card
│   │   │   ├── Input.jsx                # Form input
│   │   │   ├── Textarea.jsx             # Form textarea
│   │   │   ├── Select.jsx               # Form dropdown
│   │   │   ├── Badge.jsx                # Category/cert badges
│   │   │   ├── Modal.jsx                # Modal dialog
│   │   │   ├── Loader.jsx               # Loading states
│   │   │   ├── Skeleton.jsx             # Skeleton loaders
│   │   │   └── Icon.jsx                 # Icon wrapper
│   │   │
│   │   └── sections/           # Page section components
│   │       ├── home/
│   │       │   ├── Hero.jsx             # Homepage hero with 3D
│   │       │   ├── ProductGrid.jsx      # Category cards grid
│   │       │   ├── CompanyOverview.jsx  # Stats + SA map
│   │       │   ├── WhyChooseUs.jsx      # 4 feature cards
│   │       │   ├── BlogPreview.jsx      # Latest posts carousel
│   │       │   └── ContactCTA.jsx       # Contact form CTA
│   │       │
│   │       ├── services/
│   │       │   ├── ServicesHero.jsx
│   │       │   ├── ServicesGrid.jsx
│   │       │   └── ConsultationCTA.jsx
│   │       │
│   │       ├── about/
│   │       │   ├── AboutHero.jsx
│   │       │   ├── CompanyStory.jsx
│   │       │   ├── MissionVision.jsx
│   │       │   ├── CoreValues.jsx
│   │       │   ├── LeadershipProfile.jsx
│   │       │   └── Timeline.jsx
│   │       │
│   │       ├── blog/
│   │       │   ├── BlogGrid.jsx
│   │       │   ├── CategoryFilter.jsx
│   │       │   └── Pagination.jsx
│   │       │
│   │       └── contact/
│   │           ├── ContactHero.jsx
│   │           ├── ContactInfo.jsx
│   │           ├── ContactForm.jsx
│   │           └── LocationMap.jsx
│   │
│   ├── pages/                  # Route pages
│   │   ├── Home.jsx
│   │   ├── Services.jsx
│   │   ├── About.jsx
│   │   ├── Blog.jsx
│   │   ├── BlogPost.jsx
│   │   ├── Contact.jsx
│   │   └── NotFound.jsx
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useScrollAnimation.js        # Scroll-triggered animations
│   │   ├── use3DLoader.js               # 3D model loading hook
│   │   ├── useMediaQuery.js             # Responsive detection
│   │   ├── useIntersection.js           # Viewport detection
│   │   └── useReducedMotion.js          # Motion preference
│   │
│   ├── utils/                  # Utility functions
│   │   ├── animations.js                # Framer Motion variants
│   │   ├── validators.js                # Form validation schemas
│   │   ├── helpers.js                   # General utilities
│   │   ├── seo.js                       # SEO helper functions
│   │   └── analytics.js                 # GA4 event helpers
│   │
│   ├── styles/                 # Global styles
│   │   ├── globals.css                  # Base styles, resets
│   │   ├── tailwind.css                 # Tailwind imports
│   │   └── fonts.css                    # Font declarations
│   │
│   ├── data/                   # Static data
│   │   ├── products.js                  # Product categories data
│   │   ├── services.js                  # Services list data
│   │   ├── blogPosts.js                 # Blog content
│   │   ├── company.js                   # Company info
│   │   └── navigation.js                # Nav menu structure
│   │
│   ├── assets/                 # Source assets (processed by Vite)
│   │   ├── images/             # JPG, PNG, WebP images
│   │   │   ├── hero/
│   │   │   ├── products/
│   │   │   ├── blog/
│   │   │   ├── team/
│   │   │   └── backgrounds/
│   │   │
│   │   ├── models/             # 3D models (GLB/GLTF)
│   │   │   ├── bolt.glb
│   │   │   ├── pipe.glb
│   │   │   ├── drill.glb
│   │   │   ├── hardhat.glb
│   │   │   ├── bearing.glb
│   │   │   ├── transformer.glb
│   │   │   ├── pipe-elbow.glb
│   │   │   └── tissue-roll.glb
│   │   │
│   │   └── icons/              # Custom SVG icons
│   │       ├── bwo-badge.svg
│   │       ├── bbbee-badge.svg
│   │       └── logo.svg
│   │
│   ├── App.jsx                 # Root component
│   ├── main.jsx                # Entry point
│   └── router.jsx              # React Router config
│
├── config/                     # Configuration files (out of root)
│   ├── vite.config.js          # Vite configuration
│   ├── tailwind.config.js      # Tailwind configuration
│   ├── postcss.config.js       # PostCSS configuration
│   └── eslint.config.js        # ESLint configuration
│
├── docs/                       # Documentation
│   ├── DESIGN_SYSTEM.md        # This design system doc
│   ├── FOLDER_STRUCTURE.md     # This file
│   ├── CONTENT_GUIDE.md        # How to update content
│   └── DEPLOYMENT.md           # Deployment instructions
│
├── package.json                # Dependencies (required in root)
├── package-lock.json           # Lock file
├── index.html                  # Entry HTML (Vite requirement)
└── README.md                   # Project readme
```

## Why This Structure?

### Root Directory
- **ONLY** files that **MUST** be in root:
  - `package.json` (npm requirement)
  - `index.html` (Vite requirement)
  - `README.md` (GitHub convention)

### Config Directory
All tool configurations moved to `config/`:
- Keeps root clean
- All configs in one place
- Vite supports custom config paths

### Component Organization
Components organized by **function**, not file type:
- `3d/` - All Three.js related
- `layout/` - Page structure
- `ui/` - Base reusable elements
- `sections/` - Page-specific sections

### Sections Sub-Organization
Sections grouped by **page**:
- Makes it clear what belongs where
- Easy to find components
- Matches mental model of the site

### Data Layer
Static data in `data/`:
- Easy to update content without touching components
- Prepares for future CMS integration
- Single source of truth

### Assets Strategy
- `public/` - Static, copied as-is (favicon, robots.txt)
- `src/assets/` - Processed by Vite (optimized, hashed)

---

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ProductCard.jsx` |
| Hooks | camelCase, "use" prefix | `useScrollAnimation.js` |
| Utils | camelCase | `validators.js` |
| Data | camelCase | `blogPosts.js` |
| Styles | kebab-case | `globals.css` |
| Images | kebab-case | `hero-background.webp` |
| 3D Models | kebab-case | `pipe-elbow.glb` |

---

## Import Aliases

```javascript
// vite.config.js will set up these aliases:
{
  '@': '/src',
  '@components': '/src/components',
  '@ui': '/src/components/ui',
  '@3d': '/src/components/3d',
  '@sections': '/src/components/sections',
  '@hooks': '/src/hooks',
  '@utils': '/src/utils',
  '@data': '/src/data',
  '@assets': '/src/assets',
  '@styles': '/src/styles'
}

// Usage:
import { Button } from '@ui/Button';
import { IndustrialScene } from '@3d/IndustrialScene';
import { useScrollAnimation } from '@hooks/useScrollAnimation';
```

---

## Current Status

```
batlokoainnovpro/
├── public/          ✓ Created
├── src/
│   ├── components/
│   │   ├── 3d/      ✓ Created
│   │   ├── layout/  ✓ Created
│   │   ├── ui/      ✓ Created
│   │   └── sections/✓ Created
│   ├── pages/       ✓ Created
│   ├── hooks/       ✓ Created
│   ├── utils/       ✓ Created
│   ├── styles/      ✓ Created
│   ├── data/        ✓ Created
│   └── assets/
│       ├── images/  ✓ Created
│       ├── models/  ✓ Created
│       └── icons/   ✓ Created
├── config/          ✓ Created
└── docs/            ✓ Created
```

Awaiting design system approval before populating files.
