# LocalReach — Your neighbourhood. Your marketplace.

A production-ready, multi-tenant local-community advertising platform that works **with** existing WhatsApp advertising groups rather than replacing them.

Initial pilot community: **Umgeni Park & Durban North, KwaZulu-Natal, South Africa**.

---

## Architecture

```
LocalReach/
├── prisma/              # PostgreSQL schema + migrations + seed
├── public/              # Static assets, PWA icons, manifest
├── scripts/             # Utility scripts
├── src/
│   ├── app/             # Next.js App Router routes
│   │   ├── (marketing)/ # Public pages (home, ads, businesses, community)
│   │   ├── (auth)/      # Login, register, forgot/reset password
│   │   ├── dashboard/   # User dashboard (ads, business, saved, payments)
│   │   ├── admin/       # Community admin (moderation, rules, revenue)
│   │   ├── platform/    # Super-admin (communities, users, payments)
│   │   └── api/         # Auth, uploads, files, webhooks, communities
│   ├── components/      # Reusable UI (ui/, ads/, dashboard/, layout/)
│   ├── lib/             # Business logic (server-only where appropriate)
│   │   ├── ads/         # Advert service, quota, posting hours, validation
│   │   ├── auth/        # Auth.js config, access control, RBAC
│   │   ├── payments/    # PayFast + mock provider, webhooks, checkout
│   │   ├── revenue/     # Revenue split calculation + DB persistence
│   │   ├── moderation/  # Pipeline, keywords, duplicate detection
│   │   ├── rules/       # Configurable community rule engine
│   │   ├── whatsapp/    # WhatsApp-ready content generators
│   │   ├── storage/     # S3-compatible (R2/AWS/Supabase) + local fallback
│   │   ├── businesses/  # Business profiles + specials
│   │   ├── communities/ # Community service, defaults, onboarding
│   │   ├── audit/       # Audit logging service
│   │   ├── email/       # Email abstraction (Resend-ready)
│   │   ├── notifications/# In-app + email notification service
│   │   └── rate-limit/  # In-memory sliding-window rate limiter
│   ├── types/           # TypeScript type declarations
│   └── middleware.ts    # Route protection (auth, role checks)
└── tests/               # Unit tests (vitest)
```

---

## Database

Full Prisma schema with 30+ models:

| Domain | Models |
|--------|--------|
| Identity | User, Role, Permission, CommunityAdmin, CommunityMember, Invitation |
| Community | Community, CommunityRule, Category, Subcategory, WhatsAppTemplate |
| Marketplace | Advert, AdvertImage, AdvertQuotaUsage, SavedAdvert, AdvertReport, AdvertInteraction, AdvertView |
| Business | BusinessProfile, BusinessSpecial, Review |
| Finance | PricingPlan, Order, Payment, Subscription, RevenueShareRule, RevenueTransaction, CommunityPayout |
| Safety | ModerationAction, UserStrike, AuditLog |

All monetary amounts use Decimal; soft deletion via deletedAt; audit trail for all admin actions.

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Install

```bash
git clone <repo-url> localreach
cd localreach
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL and secrets
```

### Database

```bash
createdb localreach
npx prisma migrate deploy
npx prisma db seed
```

### Develop

```bash
npm run dev
```

### Test

```bash
npm test
```


## Authentication and RBAC

Auth.js (NextAuth) with email/password and optional Google OAuth.

8 roles with explicit permissions (not role-string checks):

| Role | Abilities |
|------|-----------|
| SUPER_ADMIN | Full platform access |
| PLATFORM_MODERATOR | Cross-community moderation |
| COMMUNITY_OWNER | Full admin of their community |
| COMMUNITY_ADMIN | Manage community, approve ads, view revenue |
| MODERATOR | Moderate ads and reports |
| BUSINESS_OWNER | Business profile, specials, analytics |
| ADVERTISER | Create and boost ads |
| USER | Browse, save, report |

Permissions are checked server-side using the JWT session plus fresh DB lookups for community membership.

---

## Core Business Rules (Umgeni Park Pilot)

Enforced server-side through the rule engine:

- 2 free adverts per rolling 7 days (tracked via AdvertQuotaUsage, not row counts)
- Maximum 2 images per advert (validated client and server-side: MIME, magic bytes, dimensions)
- Members may submit adverts at any time — the former 20:00-06:00 quiet-hours rule is disabled by default (admins can re-enable posting-hour windows per community in the rule editor)
- Prohibited content: firearms, weapons, politics, racism, sexism, swearing, pornography, WhatsApp group links, external platform promotion
- Buyer beware: platform does not guarantee transactions
- Admins can override any automated decision

---

## Payments

Provider-abstracted (lib/payments/provider.ts):

- PayFast: used when PAYFAST_MERCHANT_ID and PAYFAST_MERCHANT_KEY are set
- Mock: development fallback (no credentials)
- Stripe: ready to implement via the same PaymentProvider interface

Flow: Create Order then Create pending Payment then Redirect to provider then Webhook verification then Mark paid then Activate boost then Record revenue then Generate receipt.

All amounts come from PricingPlan server-side, never from the client.

---

## Revenue Sharing

Configurable per community (default 70/30):

R39 boost yields Platform R27.30 and Community R11.70.

Tracked through RevenueTransaction and CommunityPayout models. Admins see estimated earnings; actual payouts require manual approval.

---

## WhatsApp Integration

WhatsApp remains central:

- Community WhatsApp invite URL (configurable by admin)
- Share to WhatsApp buttons on every advert
- Admin Copy WhatsApp Text and Share to WhatsApp tools
- Configurable templates with variables
- WhatsApp-ready short, detailed, and business special formats
- wa.me share links (no scraping, no auto-messaging)

---

## Images

- S3-compatible storage (Cloudflare R2, AWS S3, Supabase Storage)
- Local fallback for development
- Validation: MIME type, magic bytes, extension, size (5MB max), dimensions
- Thumbnail generation ready
- Never stored in PostgreSQL, only metadata and URLs

---

## Security

- Server-side authorization on every protected operation
- Zod validation on every mutation
- Rate limiting (sliding window)
- CSRF protection (Auth.js)
- Password hashing (bcrypt, 12 rounds)
- Secure cookies
- Webhook signature verification
- No secrets exposed client-side
- Audit logs for sensitive admin actions
- SQL injection protection (Prisma parameterized queries)
- XSS protection (React escaping and input sanitization)

---

## Analytics

Privacy-conscious (no IPs, no personal identifiers):

- Advert views, WhatsApp clicks, phone clicks, website clicks, saves, shares
- Business analytics dashboard
- Community analytics dashboard
- Platform-wide analytics

---

## SEO

- Dynamic metadata on every public page
- OpenGraph and Twitter/X cards
- Structured data (LocalBusiness schema)
- /sitemap.xml and /robots.txt
- Canonical URLs

---

## PWA

- Web app manifest (/manifest.webmanifest)
- Mobile metadata and icons
- Bottom mobile navigation (Home, Search, Post, Saved, Account)

---

## Testing

npm test runs vitest unit tests covering:

- Quota calculation (rolling window, reset timing)
- Revenue split (float drift handling, admin percentage)
- Posting hours (timezone-aware; unrestricted 0/0 default, disabled rule, override)
- Permissions (role to permission mapping)
- Rule engine (all rule types)
- WhatsApp template rendering

---

## Deployment

Vercel (recommended):
1. Set environment variables in Vercel dashboard
2. Add PostgreSQL database (Supabase, Neon, Railway, etc.)
3. npx prisma migrate deploy as build step
4. Deploy

Key environment variables (see .env.example for full list):

- DATABASE_URL (required): PostgreSQL connection string
- AUTH_SECRET (required): Auth.js secret (generate with openssl rand -base64 32)
- NEXT_PUBLIC_APP_URL (required): Public app URL
- PAYFAST_MERCHANT_ID (optional): Enables PayFast
- PAYFAST_MERCHANT_KEY (optional): Enables PayFast
- STORAGE_ENDPOINT (optional): S3-compatible endpoint
- STORAGE_ACCESS_KEY (optional): S3 access key
- STORAGE_SECRET_KEY (optional): S3 secret key
- STORAGE_BUCKET (optional): S3 bucket
- RESEND_API_KEY (optional): Enables email sending
- GOOGLE_CLIENT_ID (optional): Enables Google OAuth

---

## Community Partner Model

LocalReach partners with existing WhatsApp and Facebook community admins:

- Admins keep their community and WhatsApp groups
- LocalReach provides technology, marketplace, moderation tools, monetisation
- Admins earn a configurable percentage of paid advertising revenue
- Admins can override automated moderation decisions
- Pilot mode available for new communities

---

## License

Proprietary — LocalReach.
