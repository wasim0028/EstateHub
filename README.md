# 🏡 EstateHub — Real Estate Full-Stack Application

A production-ready real estate portal built with **Next.js 14 (App Router)** and **Python Django REST Framework**

## 🔀 Merge notes (contact + site-visit payment feature)

This build merges in a previously-separate feature branch that adds:

- **`/contact` page** — public contact form (`ContactMessage` model + `POST /api/contact-messages/`).
- **"Book a site visit" token payment** — `BookVisitButton` on the property detail page, backed by Razorpay Standard Checkout (`Booking` model + `/api/bookings/create_order/`, `/api/bookings/verify_payment/`, `/api/bookings/mine/`). Payment only ever reachable when logged in.

While merging, the following pre-existing bugs were found and fixed so the app actually builds and runs:

1. **Client/server import boundary break** — `lib/api.ts` imports `next/headers` (server-only) but was also exporting the client-side Axios instance used by `AuthProvider`, `InquiryForm`, `WishlistButton`, and the agent admin page. Any Next.js production build fails once a Client Component pulls in a server-only module. Fixed by splitting the client-safe pieces (Axios instance, wishlist, booking, contact helpers) into `lib/api-client.ts`, and repointing all four Client Components to import from there.
2. **`next.config.ts` unsupported** — this Next.js version (14.2.5) only supports `next.config.js`/`.mjs`. Converted to `next.config.mjs`.
3. **Missing `<Suspense>` around `useSearchParams()`** — `/login` and `/register` both call `useSearchParams()` at the top level, which Next.js requires to be wrapped in `<Suspense>` for static export. Both pages now export a thin wrapper component that wraps the form in `<Suspense>`.
4. **No migrations existed** — `users` and `properties` only had empty `migrations/__init__.py` files. Generated real initial migrations (`0001_initial.py`, etc.) for both apps, verified against SQLite (set `USE_SQLITE=True` in `.env` for local testing without Postgres).

All of the above were verified: `npm run build` completes cleanly (16/16 pages), and the backend was smoke-tested end-to-end (migrate → seed data → register/login → contact form submission (201) → booking creation reaching Razorpay's API with a real signed request, only failing on the network hop to Razorpay itself in the test sandbox).

One environment quirk worth knowing about: the `razorpay` SDK (v1.4.2) still imports `pkg_resources`, which very recent `setuptools` releases have started dropping. If `pip install` gives you a `pkg_resources` import error, run `pip install "setuptools<81"`.

## ✨ What's new in this build

- **BHK-first listings** — properties carry a `bhk` config (1/2/3/4 BHK), carpet vs. super area, possession status (ready to move / under construction / new launch), furnishing, and transaction type (new booking / resale).
- **Verified & Featured badges** — `is_verified` / `is_featured` flags on listings, surfaced as ribbons on cards and the detail page.
- **Wishlist / Shortlist** — heart-icon save button on every card and the detail page (`/api/properties/{slug}/toggle_save/`), with a dedicated `/wishlist` page.
- **Locality insights** — a new `Locality` model + `/api/localities/` endpoint power an "Explore by locality" homepage section (avg price/sqft, hero image, property count).
- **Indian price formatting** — `formatted_price` now renders in Lakh/Crore notation (₹45.0 L, ₹1.20 Cr) instead of raw USD.
- **Richer seed data** — `seed_data.py` now seeds 9 properties and 9 localities across Kolkata, Mumbai, Bangalore, Delhi, Hyderabad, and Pune.

> ⚠️ These add new model fields (`Property.bhk`, `Property.locality`, `Property.is_verified`, etc.) and two new models (`Locality`, `SavedProperty`). Run `python manage.py makemigrations properties && python manage.py migrate` after pulling this build.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER                                  │
│  Next.js Client Components (filters, auth forms, map)           │
│  In-memory access token | httpOnly cookies (set by server)      │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────────┐
│                      NEXT.JS SERVER                              │
│                                                                  │
│  Server Components ──► fetch() ──► Django API (SSR / ISR)       │
│  Route Handlers    ──► Auth proxy, cookie management            │
│  Middleware        ──► Edge auth guard (cookie check)           │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Internal HTTP
┌──────────────────────────▼──────────────────────────────────────┐
│                      DJANGO + DRF                                │
│                                                                  │
│  /api/auth/*    JWT auth (SimpleJWT) + token blacklisting       │
│  /api/properties/   Full CRUD + search + filtering              │
│  /api/inquiries/    Property inquiry management                  │
│                                                                  │
│  PostgreSQL ◄──────────────────────────────────────────────────►│
│  S3 / Cloudinary (media)                                         │
└──────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
EstateHub/
├── backend/                          # Django project
│   ├── config/
│   │   ├── settings.py               ← Main settings (DB, CORS, JWT, DRF)
│   │   └── urls.py                   ← Root URL config
│   ├── users/
│   │   └── models.py                 ← User + AgentProfile models
│   ├── properties/
│   │   └── models.py                 ← Property + PropertyImage + Inquiry
│   ├── realestate/
│   │   ├── serializers.py            ← All DRF serializers
│   │   ├── views.py                  ← ViewSets + auth views
│   │   ├── filters.py                ← django-filter FilterSet
│   │   ├── permissions.py            ← IsAgentOrReadOnly, IsOwnerOrAdmin
│   │   └── urls.py                   ← API URL routing
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/                         # Next.js project
    └── src/
        ├── app/
        │   ├── layout.tsx            ← Root layout (fonts, metadata)
        │   ├── api/
        │   │   └── auth/
        │   │       ├── route.ts      ← POST (login) / DELETE (logout)
        │   │       └── refresh/
        │   │           └── route.ts  ← GET (token refresh)
        │   ├── properties/
        │   │   └── page.tsx          ← RSC: server-fetched property list
        │   └── agent/
        │       ├── layout.tsx        ← Auth-guarded agent shell
        │       ├── dashboard/
        │       │   └── page.tsx      ← Agent overview
        │       ├── listings/         ← CRUD for agent's properties
        │       └── inquiries/        ← Inquiry management
        ├── components/
        │   ├── AuthProvider.tsx       ← Client auth context + hooks
        │   ├── Providers.tsx          ← Root client provider wrapper
        │   ├── Navbar.tsx             ← Responsive navigation
        │   └── property/
        │       ├── PropertyCard.tsx   ← Server Component card
        │       ├── PropertyFilter.tsx ← Client Component filter sidebar
        │       ├── SortSelect.tsx     ← Client sort dropdown
        │       ├── Pagination.tsx     ← Client pagination
        │       ├── SearchHeader.tsx   ← Server header with count
        │       └── PropertyCardSkeleton.tsx
        ├── lib/
        │   └── api.ts                ← serverFetch + Axios client instance
        ├── types/
        │   └── index.ts              ← All TypeScript interfaces
        └── middleware.ts             ← Edge auth guard
```

---

## Quick Start

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv && venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — set DJANGO_SECRET_KEY, DB_* values

# Create PostgreSQL database
createdb realestate_db

# Run migrations
python manage.py makemigrations users properties
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# (Optional) Seed sample properties, localities & agents across Indian cities
python manage.py shell < seed_data.py

# Start dev server
python manage.py runserver
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local

# Start dev server
Remove-Item -Recurse -Force .next
npm run dev
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register/` | Public | Create account |
| POST | `/api/auth/login/` | Public | Login, get JWT |
| POST | `/api/auth/logout/` | Auth | Blacklist refresh token |
| GET | `/api/auth/me/` | Auth | Get current user |
| GET | `/api/properties/` | Public | List properties |
| POST | `/api/properties/` | Agent | Create listing |
| GET | `/api/properties/{slug}/` | Public | Property detail |
| PUT | `/api/properties/{slug}/` | Owner | Update listing |
| DELETE | `/api/properties/{slug}/` | Owner | Delete listing |
| GET | `/api/properties/my_listings/` | Agent | Agent's own listings |
| POST | `/api/properties/{slug}/inquire/` | Any | Submit inquiry |
| POST | `/api/properties/{slug}/toggle_save/` | Auth | Wishlist toggle (heart icon) |
| GET | `/api/properties/saved/` | Auth | Current user's shortlisted properties |
| GET | `/api/inquiries/` | Agent | Agent's inquiries |
| GET | `/api/localities/` | Public | Locality list (supports `?city=`) |
| GET | `/api/localities/{slug}/` | Public | Locality detail |

### Property Filter Query Parameters

```
GET /api/properties/?search=whitefield&city=Bangalore&property_type=sale
    &bhk=3&price_min=5000000&price_max=15000000&possession_status=ready_to_move
    &furnishing=semi_furnished&locality=Whitefield&ordering=-price
```

---

## Key Design Decisions

### JWT Security Pattern
Tokens **never touch the browser's JavaScript scope**:
1. Django issues `access` + `refresh` tokens
2. Next.js Route Handler (`/api/auth`) receives them and immediately sets `httpOnly` cookies
3. Browser cookies are sent automatically on same-origin requests
4. Client Axios instance reads an **in-memory** access token (populated from the `/api/auth/me` response)
5. On 401, the Axios interceptor calls `/api/auth/refresh` (a Route Handler that rotates the cookie server-side)

### RSC / Client Component Boundary
- **Server Components**: property listings, property detail, agent dashboard panels — full HTML sent to crawler/browser
- **Client Components**: `PropertyFilter`, `SortSelect`, `Pagination`, `Navbar` (auth state), all forms
- The boundary is enforced by the `"use client"` directive and the component tree structure

### ISR Caching Strategy
```typescript
// Public listings: revalidate every 60s
fetch(url, { next: { revalidate: 60, tags: ['properties'] } })

// Property detail: 5 minutes
fetch(url, { next: { revalidate: 300 } })

// Agent dashboard: no cache (always fresh)
fetch(url, { next: { revalidate: 0 } })
```

On-demand revalidation via `revalidateTag('properties')` can be triggered in Route Handlers when a listing is updated.

---

## Production Checklist

- [ ] Set `DEBUG=False` in Django
- [ ] Set `USE_S3=True` and configure AWS credentials
- [ ] Update `CORS_ALLOWED_ORIGINS` to production domain
- [ ] Configure PostgreSQL with connection pooling (PgBouncer)
- [ ] Set up Gunicorn + Nginx for Django
- [ ] Deploy Next.js to Vercel or self-host with Node
- [ ] Set `NEXT_PUBLIC_API_URL` to production Django URL
- [ ] Configure HTTPS (SSL) on both services
- [ ] Set `SECURE_SSL_REDIRECT=True` in Django settings
