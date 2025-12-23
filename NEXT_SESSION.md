# BATLOKOA ADMIN SYSTEM - SESSION HANDOFF

**Session Date:** December 23, 2025

---

## WHAT WAS DONE THIS SESSION

### Smart AI Factory - Complete Implementation

Built the complete Batlokoa Smart AI Factory as specified in the engineered prompt - a zero-cost, offline-capable, pattern-matching AI assistant.

**Phase 1: Knowledge Bases** - Created JSON data files:
- `backend/src/services/ai/smartLocalAI/knowledge/patterns.json` - 24 intent patterns
- `backend/src/services/ai/smartLocalAI/knowledge/responses.json` - Response templates
- `backend/src/services/ai/smartLocalAI/knowledge/synonyms.json` - EN/AF/ZU mappings
- `backend/src/services/ai/smartLocalAI/knowledge/compliance.json` - SANS standards

**Phase 2: Core Engines** - Built pattern matching core:
- `core/PatternMatcher.js` - Regex pattern matching with synonyms
- `core/IntentClassifier.js` - Intent classification with confidence scores
- `core/ContextManager.js` - Multi-turn conversation state (DB persisted)
- `core/ScoringEngine.js` - Lead scoring with 50+ event types
- `core/ResponseGenerator.js` - Template-based response generation

**Phase 3: Domain Engines**:
- `engines/ProductEngine.js` - Product search with fuzzy matching
- `engines/QuoteEngine.js` - Pricing, bulk discounts, delivery estimates
- `engines/ComplianceEngine.js` - SANS/OHSA/DMR compliance checking

**Phase 4: Integration**:
- `AIFactory.js` - Main orchestrator coordinating all components
- `index.js` - Exports and helper functions
- `ai.routes.js` - Comprehensive API endpoints

**Phase 5: Frontend**:
- `src/context/ChatContext.jsx` - Chat state management
- `src/components/ui/ChatWidget.jsx` - Floating chat widget with dark mode
- Updated `src/App.jsx` to include ChatProvider and ChatWidget

**Phase 6: Offline Capability**:
- `public/sw.js` - Service worker for caching
- `src/hooks/useServiceWorker.js` - SW registration hook

**Phase 8: Documentation**:
- `docs/smart-ai-factory.html` - Branded HTML documentation

### Deployment Ready

**Frontend tarball created:** Built and ready in `/dist`
**Backend tarball created:** `/tmp/batlokoa-backend-20251223.tar.gz`
**Prisma migration applied locally:** `20251223112148_add_smart_ai_tables`

### Database Schema Updates

Added to `backend/prisma/schema.prisma`:
- `ChatSession` - Conversation tracking with lead scoring
- `ChatMessage` - Message history with intent/confidence
- `LeadEvent` - Scoring events
- `ComplianceStandard` - SANS/OHSA standards
- New enums: `MessageRole`, `LeadTier`

---

## CREDENTIALS - SOURCE OF TRUTH: `backend/prisma/seed.js`

### Admin Login
- Email: `admin@batlokoainnovpro.co.za`
- Password: `Admin@2026!`

### Staff Login
- Email: `staff@batlokoa.co.za`
- Password: `Staff@123!`

### Demo Customer (Portal)
- Email: `demo@engineering.co.za`
- Company: Demo Engineering (Pty) Ltd

---

## PORTS - FIXED, NEVER CHANGE

| Service | Port | URL |
|---------|------|-----|
| Frontend (Vite) | 5173 | http://localhost:5173 |
| Backend (Express) | 3016 | http://localhost:3016 |
| Prisma Studio | 5556 | http://localhost:5556 |

---

## LIVE SERVER

| Item | Value |
|------|-------|
| Domain | batlokoa.cleva-ai.co.za |
| Admin URL | https://batlokoa.cleva-ai.co.za/admin |
| Portal URL | https://batlokoa.cleva-ai.co.za/portal |
| Nginx root | /var/www/batlokoa/frontend/dist |
| Backend port | 3016 |

### Deployment Commands

**Frontend:**
```bash
scp -r /Users/florisolivier/batlokoainnovpro/dist/* root@batlokoa.cleva-ai.co.za:/var/www/batlokoa/frontend/dist/ && ssh root@batlokoa.cleva-ai.co.za "chown -R www-data:www-data /var/www/batlokoa/frontend/dist && chmod -R 755 /var/www/batlokoa/frontend/dist && echo 'Frontend deployed'"
```

**Backend with Smart AI:**
```bash
scp /tmp/batlokoa-backend-20251223.tar.gz root@batlokoa.cleva-ai.co.za:/tmp/ && ssh root@batlokoa.cleva-ai.co.za "cd /var/www/batlokoa && tar -xzf /tmp/batlokoa-backend-20251223.tar.gz && npm install --production && npx prisma migrate deploy && pm2 restart batlokoa && rm /tmp/batlokoa-backend-20251223.tar.gz && echo 'Backend deployed'"
```

---

## API ENDPOINTS

Base URL: `http://localhost:3016/api/v1`

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Admin login |
| GET | `/auth/me` | Get current user |
| POST | `/portal/auth/login` | Customer portal login |

### Core CRUD
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/products` | List/Create products |
| GET/PUT/DELETE | `/products/:id` | Get/Update/Delete product |
| GET/POST | `/categories` | List/Create categories |
| GET/POST | `/customers` | List/Create customers |
| GET/POST | `/orders` | List/Create orders |
| GET/POST | `/quotes` | List/Create quotes |
| GET/POST | `/invoices` | List/Create invoices |

### Suppliers & Purchase Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/suppliers` | List/Create suppliers |
| PUT/DELETE | `/suppliers/:id` | Update/Delete supplier |
| GET/POST | `/purchase-orders` | List/Create POs |
| PUT | `/purchase-orders/:id` | Update PO (DRAFT only) |
| POST | `/purchase-orders/:id/receive` | Receive stock |

### Customer Portal
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/portal/dashboard` | Customer dashboard data |
| GET | `/portal/orders` | Customer's orders |
| GET | `/portal/quotes` | Customer's quotes |
| GET | `/portal/invoices` | Customer's invoices |
| GET | `/portal/profile` | Customer profile |

### Smart AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/chat` | Main chat endpoint |
| GET | `/ai/health` | AI health check |
| GET | `/ai/metrics` | Performance metrics |
| GET | `/ai/search` | AI-powered product search |
| POST | `/ai/price` | Calculate pricing |
| POST | `/ai/quote` | Multi-item quote |
| GET | `/ai/compliance/check` | Check product compliance |
| GET | `/ai/compliance/standards` | List all standards |
| GET | `/ai/compliance/industries` | List industries |
| GET | `/ai/bbbee` | BBB-EE information |
| POST | `/ai/track` | Track scoring event |
| GET | `/ai/leads/hot` | Hot leads for sales |
| GET | `/ai/analytics` | Scoring analytics |
| GET | `/ai/score/session/:id` | Get session score |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/settings` | Get company settings |
| PUT | `/settings` | Update settings |
| GET | `/audit` | Get audit log |
| GET | `/search` | Global search |
| GET | `/reports/*` | Various reports |

---

## SYSTEM MODULES

### Admin Panel (`/admin`)
1. Dashboard - Stats, alerts, quick actions
2. Products - CRUD, inventory management
3. Categories - Product categorization
4. Customers - CRM with lead scoring, VIP tags
5. Orders - Full lifecycle, POP approval, dispatch
6. Quotes - Create, send, convert to order
7. Invoices - Generate, payments, PDF download
8. Suppliers - Supplier management
9. Purchase Orders - Procurement, stock receiving
10. Settings - Company configuration
11. Audit Log - Activity tracking
12. Reports - Business analytics

### Customer Portal (`/portal`)
- Dashboard - Overview with stats cards
- Orders - View order history and details
- Quotes - View quotes
- Invoices - View invoices, payment status
- Profile - Update contact details (Profile, Address, Security tabs)
- **Dark Mode:** Full dark/light theme toggle (same as Admin)

---

## DOCUMENTATION FILES

Located in `docs/`:
- `training-guide.html` - Staff training manual (v2.0)
- `uat-checklist.html` - Interactive testing checklist (75 test cases)
- `client-presentation.html` - Professional client presentation
- `order-flow-guide.html` - Order workflow documentation
- `smart-ai-factory.html` - Smart AI technical documentation (NEW)
- `DESIGN_SYSTEM.md` - Colors, typography, components

---

## COMPANY INFO

- **Company:** Batlokoa Innovative Projects
- **Contact:** Cornelia Lethunya
- **Phone:** +27 73 974 8317
- **WhatsApp:** 27739748317
- **Email:** info@batlokoainnovpro.co.za
- **Address:** 12 A Bussing Rd, Aureus Ext 1, Randfontein, Gauteng

---

## USER PREFERENCES

- No emojis
- Port 5173 frontend, 3016 backend - NEVER CHANGE
- Mobile-first responsive design
- Dark/light mode support in BOTH Admin and Portal
- ALWAYS verify credentials from seed.js before documenting
- ALWAYS check nginx config before deploying
- NEVER assume values - check source files first

---

**END OF HANDOFF**
