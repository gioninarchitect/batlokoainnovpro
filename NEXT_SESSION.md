# BATLOKOA WEBSITE - SESSION HANDOFF

**Session Date:** December 22, 2025 (Updated 15:55)

---

## WHAT WE DID THIS SESSION

### Completed Tasks:
1. **Background Images** - Added to About, Services, Contact pages (80% overlay)
2. **Logo on PDFs** - Added company logo to Invoice and Quote PDFs
3. **Mobile Admin Workflow** - Added bottom navigation bar for mobile
4. **WhatsApp Button** - Added floating click-to-chat button (bottom-left)
5. **EFT/POP Workflow** - Implemented from CBD Wellness 24 reference:
   - POP upload by customers
   - View/Approve/Reject POP in admin Orders page
   - Order dispatch functionality
   - Admin deeplink in WhatsApp quote messages
6. **Deployment Package Created** - Ready for production

### Technical Changes:
- `src/pages/About.jsx` - Added background images (handTools, electrical)
- `src/pages/Services.jsx` - Added steel pipes background
- `src/pages/Contact.jsx` - Added pipe fittings background
- `src/components/admin/AdminLayout.jsx` - Added mobile bottom nav
- `src/components/layout/Layout.jsx` - Added WhatsApp floating button
- `src/components/ui/QuoteCart.jsx` - Added admin deeplink to WhatsApp template
- `src/pages/admin/Orders.jsx` - Added POP approval UI with Approve/Reject buttons
- `backend/src/services/pdf.service.js` - Added logo to Invoice/Quote PDFs
- `backend/src/controllers/orders.controller.js` - Added uploadPOP, approvePOP, rejectPOP, dispatchOrder
- `backend/src/routes/orders.routes.js` - Added multer for POP uploads, new endpoints
- `backend/prisma/schema.prisma` - Added POP fields to Order model
- `backend/assets/logo.png` - Logo file for PDFs
- `ecosystem.config.cjs` - PM2 configuration
- `nginx.conf` - Nginx server configuration
- `backend/.env.production` - Production environment template

---

## DEPLOYMENT STATUS: READY

### Tarballs Created:
- `/tmp/batlokoa-frontend-20251222.tar.gz` (7.3MB) - Frontend dist
- `/tmp/batlokoa-backend-20251222.tar.gz` (104KB) - Backend + configs

### Deployment Commands:

**1. Upload tarballs to server:**
```bash
scp /tmp/batlokoa-frontend-20251222.tar.gz /tmp/batlokoa-backend-20251222.tar.gz root@batlokoa.cleva-ai.co.za:/tmp/
```

**2. Deploy on server (one-liner):**
```bash
ssh root@batlokoa.cleva-ai.co.za "mkdir -p /var/www/batlokoa/frontend /var/www/batlokoa/backend/uploads/pop && cd /var/www/batlokoa && tar -xzf /tmp/batlokoa-frontend-20251222.tar.gz -C frontend && tar -xzf /tmp/batlokoa-backend-20251222.tar.gz && cd backend && cp .env.production .env && npm install --production && npx prisma generate && npx prisma migrate deploy && npm run db:seed && cd .. && pm2 start ecosystem.config.cjs && pm2 save && rm /tmp/batlokoa-*.tar.gz && echo 'Deployment complete'"
```

**3. Setup nginx & SSL:**
```bash
ssh root@batlokoa.cleva-ai.co.za "cp /var/www/batlokoa/nginx.conf /etc/nginx/sites-available/batlokoa && ln -sf /etc/nginx/sites-available/batlokoa /etc/nginx/sites-enabled/ && certbot --nginx -d batlokoa.cleva-ai.co.za && nginx -t && systemctl reload nginx"
```

### Pre-deployment Checklist:
1. Create PostgreSQL database on server:
   ```sql
   CREATE DATABASE batlokoa_db;
   CREATE USER batlokoa_admin WITH PASSWORD 'YOUR_SECURE_PASSWORD';
   GRANT ALL PRIVILEGES ON DATABASE batlokoa_db TO batlokoa_admin;
   ```
2. Edit `.env.production` on server with real credentials before deployment
3. Generate a secure JWT_SECRET (64+ chars)

### Post-deployment Testing:
- Frontend: https://batlokoa.cleva-ai.co.za
- Admin: https://batlokoa.cleva-ai.co.za/admin
- Login: admin@batlokoainnovpro.co.za / Admin@2026!

---

## BACKEND STRUCTURE

```
backend/
├── assets/
│   └── logo.png              # Company logo for PDFs
├── uploads/
│   └── pop/                  # Proof of payment uploads
├── .env                      # Environment variables
├── .env.production           # Production template
├── package.json
├── prisma/
│   ├── schema.prisma         # Database schema with POP fields
│   ├── migrations/           # Database migrations
│   └── seed.js               # Seed data
└── src/
    ├── server.js             # Express server entry
    ├── routes/               # API routes
    ├── controllers/          # Business logic
    │   └── orders.controller.js  # Includes POP functions
    ├── middleware/
    │   └── auth.js           # JWT auth
    └── services/
        ├── pdf.service.js    # Invoice/Quote PDFs (with logo)
        ├── email.service.js  # SMTP notifications
        └── whatsapp.service.js
```

---

## API ENDPOINTS

Base URL: `http://localhost:3001/api/v1`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login |
| GET | `/auth/me` | Get current user |
| GET | `/products` | List products |
| GET | `/categories` | List categories |
| GET | `/customers` | List customers |
| GET | `/orders` | List orders |
| GET | `/orders/stats` | Order statistics |
| POST | `/orders/:id/pop` | Upload proof of payment |
| POST | `/orders/:id/pop/approve` | Approve POP (admin) |
| POST | `/orders/:id/pop/reject` | Reject POP (admin) |
| POST | `/orders/:id/dispatch` | Dispatch order (admin) |
| GET | `/quotes` | List quotes |
| GET | `/invoices` | List invoices |
| GET | `/invoices/:id/pdf` | Download Invoice PDF |

---

## COMPANY INFO

- **Contact:** Cornelia Lethunya
- **Phone:** +27 73 974 8317
- **WhatsApp:** 27739748317
- **Email:** info@batlokoainnovpro.co.za
- **Address:** 12 A Bussing Rd, Aureus Ext 1, Randfontein, Gauteng
- **Domain:** batlokoa.cleva-ai.co.za

---

## USER PREFERENCES

- No emojis
- Port 5173 frontend, 3001 backend
- Mobile-first responsive design
- Dark/light mode support
- Owner can run business from mobile phone
- Quote submission via WhatsApp (simple workflow, no API needed)

---

**END OF HANDOFF**
