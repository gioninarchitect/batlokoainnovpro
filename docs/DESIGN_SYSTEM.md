# BATLOKOA DESIGN SYSTEM

## Approval Required Before Development

---

## 1. COLOR PALETTE

### Primary Colors
```
Navy (Primary)     #1a1a2e   ███████  - Headers, nav background, trust
Deep Blue          #16213e   ███████  - Secondary elements, cards
Industrial Blue    #0f3460   ███████  - Links, accents
```

### Accent Colors
```
Safety Red (CTA)   #e94560   ███████  - Buttons, highlights, urgency
Gold (Premium)     #d4af37   ███████  - Certifications, BWO badge
```

### Neutrals
```
White              #ffffff   ███████  - Backgrounds, text on dark
Light Gray         #f5f5f5   ███████  - Section backgrounds
Medium Gray        #cccccc   ███████  - Borders, dividers
Dark Gray          #333333   ███████  - Body text
```

### Usage Rules
| Element | Color | Notes |
|---------|-------|-------|
| Primary CTA buttons | #e94560 | White text, high contrast |
| Secondary buttons | #0f3460 | White text |
| Outline buttons | Transparent + #0f3460 border | Blue text |
| Navigation (scroll) | #1a1a2e → #ffffff | Transitions on scroll |
| Footer | #1a1a2e | Light text |
| BWO/BBB-EE badge | #d4af37 on #1a1a2e | Premium feel |

---

## 2. TYPOGRAPHY

### Font Stack
```css
--font-heading: 'Montserrat', sans-serif;
--font-body: 'Inter', sans-serif;
--font-display: 'Rajdhani', sans-serif;  /* Technical specs, numbers */
```

### Type Scale
| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Display | 72px | 800 | 1.1 | Hero headline only |
| H1 | 48px | 700 | 1.2 | Page titles |
| H2 | 36px | 700 | 1.3 | Section headers |
| H3 | 28px | 600 | 1.4 | Card titles |
| H4 | 22px | 600 | 1.4 | Subsections |
| Body Large | 18px | 400 | 1.6 | Lead paragraphs |
| Body | 16px | 400 | 1.6 | Standard text |
| Body Small | 14px | 400 | 1.5 | Captions, meta |
| Caption | 12px | 500 | 1.4 | Labels, badges |

### Mobile Scaling
| Element | Desktop | Mobile |
|---------|---------|--------|
| Display | 72px | 42px |
| H1 | 48px | 32px |
| H2 | 36px | 28px |
| H3 | 28px | 22px |
| Body | 16px | 16px (unchanged) |

---

## 3. SPACING SYSTEM

### Base Unit: 8px

```
--space-1:   8px    (0.5rem)
--space-2:   16px   (1rem)
--space-3:   24px   (1.5rem)
--space-4:   32px   (2rem)
--space-5:   48px   (3rem)
--space-6:   64px   (4rem)
--space-7:   96px   (6rem)
--space-8:   128px  (8rem)
```

### Section Padding
| Screen | Vertical | Horizontal |
|--------|----------|------------|
| Desktop | 96px (space-7) | 64px (space-6) |
| Tablet | 64px (space-6) | 32px (space-4) |
| Mobile | 48px (space-5) | 16px (space-2) |

---

## 4. 3D ELEMENT STRATEGY

### Philosophy: "Industrial Elegance"
- 3D is **enhancement, not distraction**
- Every 3D element must have **purpose**
- Performance first - complex scenes only where they matter

### Where 3D Appears (4 Key Moments)

#### 1. HERO SCENE (Maximum Impact)
```
Location: Homepage, above the fold
Elements:
  - Rotating industrial gears (3 interlocking)
  - Floating metallic particles (subtle)
  - Pipe/bolt assembly in background

Interaction:
  - Parallax on mouse move
  - Slow rotation animation (8s loop)

Performance:
  - Max 30,000 polygons
  - Mobile: Static hero image fallback
```

#### 2. PRODUCT CATEGORY CARDS (Hover Reveal)
```
Location: Homepage product grid, Services page
Behavior:
  - Card shows 2D image by default
  - On hover: 3D model fades in, rotates 360°
  - 8 unique models (one per category)

Models needed:
  1. Bolt & Nut assembly
  2. Tissue roll (simple cylinder)
  3. Steel pipe section
  4. Pipe elbow fitting
  5. Power drill
  6. Transformer box
  7. Ball bearing
  8. Hard hat

Performance:
  - Max 5,000 polygons per model
  - Lazy load on viewport entry
```

#### 3. ABOUT PAGE TIMELINE (Scroll-Triggered)
```
Location: Company history section
Elements:
  - 3D timeline with floating year markers
  - Connecting metallic tube between points

Interaction:
  - Scroll drives camera position
  - Milestone markers animate on scroll
```

#### 4. CONTACT PAGE GLOBE (Subtle)
```
Location: Contact hero background
Elements:
  - Low-poly Earth with SA highlighted
  - Pulsing location marker

Interaction:
  - Slow auto-rotation
  - Click to zoom to Randfontein
```

### Where 3D Does NOT Appear
- Blog pages (pure content focus)
- Footer (performance)
- Mobile devices below 768px (static fallbacks)
- Inside form sections (distraction)

---

## 5. COMPONENT LIBRARY

### Buttons

```
┌─────────────────────────────────────┐
│  PRIMARY (Red - Main CTAs)          │
│  ┌─────────────────────────────┐    │
│  │  GET A QUOTE →              │    │
│  └─────────────────────────────┘    │
│  Background: #e94560                │
│  Text: #ffffff                      │
│  Border-radius: 8px                 │
│  Padding: 16px 32px                 │
│  Hover: Lift + darken 10%           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  SECONDARY (Blue - Secondary CTAs)  │
│  ┌─────────────────────────────┐    │
│  │  LEARN MORE                 │    │
│  └─────────────────────────────┘    │
│  Background: #0f3460                │
│  Text: #ffffff                      │
│  Border-radius: 8px                 │
│  Padding: 16px 32px                 │
│  Hover: Lift + lighten 10%          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  OUTLINE (For light backgrounds)    │
│  ┌─────────────────────────────┐    │
│  │  VIEW SERVICES              │    │
│  └─────────────────────────────┘    │
│  Background: transparent            │
│  Border: 2px solid #0f3460          │
│  Text: #0f3460                      │
│  Hover: Fill + white text           │
└─────────────────────────────────────┘
```

### Cards

```
┌───────────────────────────────────────────┐
│                                           │
│   [3D Model / Image Zone]                 │
│                                           │
├───────────────────────────────────────────┤
│                                           │
│   CATEGORY LABEL                          │
│   ─────────────────                       │
│   Card Title Here                         │
│                                           │
│   Brief description text that             │
│   explains the product or service.        │
│                                           │
│   [CTA BUTTON]                            │
│                                           │
└───────────────────────────────────────────┘

Specs:
  Background: #ffffff
  Border-radius: 16px
  Shadow: 0 4px 20px rgba(0,0,0,0.08)
  Hover: translateY(-8px), shadow increase
  Padding: 24px
```

### Navigation

```
DESKTOP (Scrolled past hero):
┌─────────────────────────────────────────────────────────────────┐
│  [LOGO]    Home  Services  About  Blog  Contact    [073 974 8317]  [GET QUOTE] │
└─────────────────────────────────────────────────────────────────┘
  Background: #ffffff (solid)
  Shadow: 0 2px 10px rgba(0,0,0,0.1)
  Position: sticky


MOBILE:
┌─────────────────────────────────────────────────────────────────┐
│  [LOGO]                                              [HAMBURGER] │
└─────────────────────────────────────────────────────────────────┘
  Hamburger opens full-screen overlay
  Background: #1a1a2e
  Links: centered, large touch targets
```

---

## 6. GRID SYSTEM

### Desktop (1440px+)
```
Container: 1200px max-width, centered
Columns: 12-column grid
Gutter: 24px
```

### Breakpoints
```css
--breakpoint-sm:  640px   /* Large phones */
--breakpoint-md:  768px   /* Tablets */
--breakpoint-lg:  1024px  /* Laptops */
--breakpoint-xl:  1280px  /* Desktops */
--breakpoint-2xl: 1536px  /* Large screens */
```

---

## 7. ICONOGRAPHY

### Primary Icon Set: Lucide React
- Consistent 24x24 base size
- 2px stroke width
- Color inherits from text

### Custom Icons Needed
1. BWO Badge (svg)
2. BBB-EE Level 1 Badge (svg)
3. Mining industry icon
4. Engineering icon

---

## 8. IMAGERY STYLE

### Photography
- Industrial environments
- Warm lighting (gold tones)
- Depth of field (products in focus)
- Human element where possible

### AI-Generated (Current Assets)
- Firefly-generated images work well
- Maintain consistent industrial aesthetic
- Replace with real photos when available

### Image Treatment
```css
/* Product images */
filter: none;
border-radius: 12px;

/* Hero backgrounds */
filter: brightness(0.7);  /* For text overlay */

/* Blog thumbnails */
aspect-ratio: 16/9;
object-fit: cover;
```

---

## 9. MOTION PRINCIPLES

### Timing
```css
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);  /* Smooth */
--ease-bounce:  cubic-bezier(0.34, 1.56, 0.64, 1);  /* Playful */
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
```

### Animation Guidelines
| Element | Animation | Duration |
|---------|-----------|----------|
| Button hover | Scale(1.02) + lift | 150ms |
| Card hover | TranslateY(-8px) | 300ms |
| Page transitions | Fade + slide | 300ms |
| 3D scene rotation | Continuous | 8000ms loop |
| Scroll reveal | FadeInUp | 500ms |

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 10. APPROVAL CHECKLIST

Please confirm:

- [ ] Color palette approved
- [ ] Typography choices approved
- [ ] 3D element placement approved (4 key moments)
- [ ] 3D scope approved (not too much, visible impact)
- [ ] Button styles approved
- [ ] Card styles approved
- [ ] Navigation behavior approved
- [ ] Overall "Industrial Elegance" direction approved

---

## NEXT STEPS AFTER APPROVAL

1. Set up Tailwind with these exact values
2. Create base component library
3. Build 3D scene prototypes
4. Begin page development

---

**Awaiting your approval before proceeding.**
