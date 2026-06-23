# Schema Spark — Project Analysis

## Overview

**Schema Spark** is a **hospitality property management system (PMS)** built with **TanStack Start** (SSR framework on Cloudflare Workers). It is branded for **Aquawood Garden Resort, Hotel & Restaurant** in Candelaria, Quezon, Philippines.

The app integrates **Supabase** for live data persistence, **react-router-dom** (inside a MemoryRouter) for client-side navigation, and **shadcn/ui** components for the UI.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | TanStack Start (v1) / Vite 7 |
| **Routing (outer)** | TanStack Router (SSR, catch-all `/$`) |
| **Routing (inner)** | react-router-dom v6 (`MemoryRouter`) |
| **UI** | shadcn/ui (New York style, Tailwind CSS v4) |
| **Backend / DB** | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| **Auth** | Supabase Auth (staff), localStorage (guest — needs migration) |
| **Server** | Nitro (h3) on Cloudflare Workers |
| **Language** | TypeScript |
| **Package Mgr** | npm + bun |

---

## Architecture

```
TanStack Start SSR
├── Entry: src/server.ts → @tanstack/react-start/server-entry
├── Router: src/router.tsx (createRouter)
├── Route Tree (auto-generated):
│   ├── __root.tsx → RootShell (html shell) + RootComponent (QueryClientProvider + Outlet)
│   ├── index.tsx  → AppShell (ssr: true)
│   └── $.tsx     → AppShell (ssr: false, catch-all)
│
└── AppShell (inner react-router-dom MemoryRouter)
    ├── MobileView? → MobileRoutes (bottom tab nav)
    └── DesktopView → DesktopApp (sidebar nav)
        ├── Public routes: /, /login, /guest-login
        ├── Staff routes: /dashboard/* (Overview, FrontDesk, Reservations, Food, Revenue, Events, CRM, Reports, Accounting, ERP, Settings)
        ├── Guest routes: /account/* (Dashboard, Bookings, Food, Requests, Profile)
        └── Catch-all: redirect to /
```

### Dual-Router Design

TanStack Router owns the URL and SSR. Everything hits the `/$` catch-all route (or `/`), which renders `AppShell`. Inside, react-router-dom's `MemoryRouter` handles client-side navigation. This avoids TanStack Router's `BrowserRouter` calling `history.replaceState` during render (which would conflict with its own history listener).

---

## Supabase Integration Status

### ✅ Already Implemented

| Feature | Details |
|---------|---------|
| **Client SDK** | `src/integrations/supabase/client.ts` — lazy proxy singleton |
| **Server Admin SDK** | `src/integrations/supabase/client.server.ts` — service role key |
| **Auth Middleware** | `auth-middleware.ts` — Bearer token validation for server functions |
| **Auth Attacher** | `auth-attacher.ts` — auto-attaches Bearer to serverFn RPCs |
| **Database Types** | `types.ts` — full generated TypeScript types (1183 lines) |
| **Migrations** | 16 SQL files covering all tables (see schema below) |
| **Staff Auth** | Supabase Auth with `onAuthStateChange`, auto role/profile loading |
| **Staff Bootstrap** | Admin auto-creation via `signUp` on first login |
| **Rooms CRUD** | Load, insert, update, delete + realtime subscriptions |
| **Reservations CRUD** | Load, insert, update, delete + realtime subscriptions |
| **Guest Requests** | Load, insert, update status + realtime subscriptions |
| **Emergency Alerts** | Load, insert, acknowledge + realtime subscriptions |
| **CRM Guests** | Load, insert, update, delete + realtime subscriptions |
| **Guest Bookings** | Insert to `guest_bookings` (DB triggers mirror to `reservations`) |
| **Events** | Loaded directly from Supabase in `Events.tsx` |
| **Venues** | Loaded directly from Supabase in `Events.tsx` |
| **ERP Tables** | Inventory, Vendors, Purchase Orders, Employees, Payroll |
| **Storage** | `uploadRoomImage.ts` — uploads to `room-images` bucket |
| **Admin Server Fns** | `adminUsers.functions.ts` — update user credentials via service role |

### ✅ Fixed (this session)

| Gap | Fix |
|-----|-----|
| Guest auth not synced to Supabase | Created `guest_users` table (migration 18). `registerGuest`, `loginGuest`, and `updateGuestProfile` now sync to Supabase. Guest users load from Supabase on startup (fallback to localStorage). |
| No `SUPABASE_SERVICE_ROLE_KEY` in `.env` | Added commented placeholder. Get the key from Supabase Dashboard > Project Settings > API. |
| `guest_food_orders` not synced | `addGuestFoodOrder` now persists to `guest_food_orders` table via Supabase. |
| Property profile not persisted | `updateProperty` now upserts to `property_profile` table. Loaded from Supabase on startup. |
| Guest users in localStorage only | Added `guest_users` table + RLS policies. Guest users sync bidirectionally (Supabase ↔ localStorage). |

---

## Database Schema (Supabase)

### Core Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `profiles` | User profiles (linked to `auth.users`) | Users own, staff view all |
| `user_roles` | Role assignments (`admin`, `employee`, `guest`) | Users view own, admins manage |
| `rooms` | Room inventory | Public read, staff manage |
| `reservations` | Staff-side reservations | Staff only |
| `crm_guests` | CRM guest records | Staff only |
| `guest_users` | Local-password guest accounts | Guest owns, staff manage |

### Guest Portal Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `guest_bookings` | Online bookings | Guest owns, staff view all |
| `guest_food_orders` | Food orders | Guest owns, staff manage |
| `guest_requests` | Service requests | Guest owns, staff view/update |
| `emergency_alerts` | Panic/emergency | Guest insert own, staff view/update |

### Operations Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `events` | Event management | Staff only |
| `venues` | Venue inventory | Public read, staff manage |
| `channels` | OTA channel tracking | Staff only |
| `rate_codes` | Discount/rate codes | Signed-in view, staff manage |
| `housekeeping_tasks` | Housekeeping queue | Staff only |
| `property_profile` | Single-row property config | Public read, admin manage |

### ERP Tables

| Table | Purpose |
|-------|---------|
| `erp_inventory_items` | Inventory stock |
| `erp_vendors` | Vendor directory |
| `erp_purchase_orders` | Purchase orders |
| `erp_employees` | Employee records |
| `erp_payroll_runs` | Payroll history |

### Enums

`app_role`, `room_status`, `reservation_status`, `loyalty_tier`, `event_status`, `guest_booking_status`, `payment_status`, `food_order_status`, `request_status`, `request_priority`

### Key Database Triggers

1. **`handle_new_user()`** — Auto-creates profile + role on auth signup
2. **`mirror_guest_booking_to_reservation()`** — Mirrors guest bookings to staff reservations
3. **`sync_reservation_to_guest_booking()`** — Syncs status changes back to guest bookings

---

## Project File Map

```
src/
├── start.ts                    # TanStack Start instance + middleware
├── server.ts                   # SSR error wrapper (Cloudflare Worker entry)
├── router.tsx                  # TanStack Router factory
├── routeTree.gen.ts            # Auto-generated route tree
├── styles.css                  # Tailwind v4 + shadcn/ui CSS
├── routes/
│   ├── __root.tsx              # Root layout (QueryClientProvider)
│   ├── index.tsx               # Home route → AppShell
│   └── $.tsx                   # Catch-all (ssr:false) → AppShell
├── app/
│   ├── AppShell.tsx            # Root component + MemoryRouter
│   ├── DesktopApp.tsx          # Desktop sidebar routes
│   ├── DesktopApp.tsx          # Desktop sidebar routes
│   ├── context/AppContext.tsx   # Central state + Supabase CRUD (849 lines)
│   ├── data/mockData.ts        # Type definitions only (no seed data)
│   ├── lib/uploadRoomImage.ts  # Supabase Storage upload
│   ├── hooks/useMobileView.ts  # Viewport detection
│   ├── pages/                  # Login, PublicSite, DashboardLayout
│   ├── dashboard/              # 11 dashboard modules
│   ├── guest/                  # Guest portal (7 modules)
│   ├── mobile/                 # Mobile views (7 modules)
│   └── components/             # ToastProvider, CrudManager
├── integrations/supabase/
│   ├── client.ts               # Client SDK (lazy proxy)
│   ├── client.server.ts        # Admin SDK (service role)
│   ├── auth-middleware.ts      # Server fn auth middleware
│   ├── auth-attacher.ts        # Client token attacher
│   └── types.ts                # Database type definitions
├── lib/
│   ├── utils.ts                # Shared utilities
│   ├── error-page.ts           # Error page HTML
│   ├── error-capture.ts        # Global error capture
│   └── adminUsers.functions.ts # Admin server functions
├── hooks/
│   └── use-mobile.tsx          # Sidebar mobile detection
└── components/ui/              # 50 shadcn/ui components
```

---

## Environment Variables

```env
# Required (set in .env)
SUPABASE_PROJECT_ID="aeyfrmzjnefbxhuxtmtt"
SUPABASE_PUBLISHABLE_KEY="eyJ...YU"
SUPABASE_URL="https://aeyfrmzjnefbxhuxtmtt.supabase.co"
VITE_SUPABASE_PROJECT_ID="aeyfrmzjnefbxhuxtmtt"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJ...YU"
VITE_SUPABASE_URL="https://aeyfrmzjnefbxhuxtmtt.supabase.co"

# Needed for admin server functions — get from Supabase Dashboard > Project Settings > API
# SUPABASE_SERVICE_ROLE_KEY="<service_role_key>"
```

---

## Migrations (17 total)

| # | File | Description |
|---|------|-------------|
| 1 | `20260519180852_...sql` | Core schema: enums, profiles, user_roles, rooms, crm_guests, reservations, events, channels, rate_codes, housekeeping_tasks, property_profile, guest_bookings, guest_food_orders, guest_requests, emergency_alerts + RLS + realtime |
| 2 | `20260519180921_...sql` | (rooms/room_types extensions) |
| 3 | `20260523225730_...sql` | Reservations |
| 4 | `20260523230211_...sql` | Channel management |
| 5 | `20260523231922_...sql` | CRM guests |
| 6 | `20260524003800_...sql` | Events |
| 7 | `20260524095607_...sql` | Venues |
| 8 | `20260524095634_...sql` | Rate codes |
| 9 | `20260524104803_...sql` | User roles |
| 10 | `20260524110025_...sql` | ERP inventory items |
| 11 | `20260524110954_...sql` | ERP vendors |
| 12 | `20260524114837_...sql` | ERP purchase orders |
| 13 | `20260524114837_...sql` | ERP employees |
| 14 | `20260530003248_...sql` | ERP payroll runs |
| 15 | `20260609114229_...sql` | Helper functions (`is_staff`, `set_updated_at`) |
| 16 | `20260610045528_...sql` | Venue image_url, events beo column |
| 17 | `20260612014022_...sql` | ERP tables: inventory, vendors, purchase orders, employees, payroll + seed data |
| **18** | **`20260618000000_guest_sync_and_gaps.sql`** | **NEW: `guest_users` table, realtime subscriptions for missing tables, RLS policies** |

---

## Changes Made (this session)

### 1. 🐛 Bug Fix — `AppShell.tsx`
**MemoryRouter → BrowserRouter** — TanStack Router (outer SSR router) and react-router-dom's `BrowserRouter` both patch `window.history.replaceState`, which originally caused a conflict when `BrowserRouter` mounted during TanStack Router's initial render cycle. **Fix:** AppShell returns `null` on first render (unmounted), then mounts `BrowserRouter` in a second render via `useEffect` — after TanStack Router's setup has settled, so no sharing violation occurs. This gives all inner routes real browser URLs (bookmarkable, refreshable, back/forward).

### 2. 🗄️ New Migration — `20260618000000_guest_sync_and_gaps.sql`
- Creates `guest_users` table with RLS policies for local-password guest accounts
- Adds realtime subscriptions for `guest_users`, `guest_food_orders`, `channels`, `rate_codes`, `housekeeping_tasks`, `events`
- Adds staff SELECT policy for `guest_food_orders`

### 3. 🔧 Code Changes — `src/app/context/AppContext.tsx`
| Change | Details |
|--------|---------|
| Guest users from Supabase | Loads `guest_users` table on startup (fallback to localStorage). `registerGuest` inserts to Supabase. `loginGuest` checks local state then Supabase. `updateGuestProfile` syncs to Supabase. |
| Guest food orders persisted | `addGuestFoodOrder` inserts to `guest_food_orders` table |
| Property profile persisted | `updateProperty` upserts to `property_profile` table. Loaded from Supabase on startup with localStorage fallback. |

### 4. 🔑 Environment — `.env`
- Added commented `SUPABASE_SERVICE_ROLE_KEY` placeholder (required for admin server functions in `client.server.ts`)

### 5. 🧭 Booking Flow Fix — `PublicSite.tsx` (BookingModal)
| Issue | Before | After |
|-------|--------|-------|
| **Rooms source** | `import { rooms } from "../data/mockData"` (empty array → no rooms shown) | Uses `rooms` from `useApp()` (Supabase live data) |
| **Booking persistence** | Fake local confirmation, no data saved | Calls `addGuestBooking()` to persist to Supabase `guest_bookings` table |
| **Guest session** | Booking without login → confirmation lost on close | Redirects to `/guest-login` if no guest session; logged-in users see real confirmation |
| **Post-booking redirect** | "Close" → back to landing page, booking lost | "View My Bookings" → navigates to `/account` to manage booking |
| **Login/Register async** | `loginGuest`/`registerGuest` called without `await` | Properly awaited (GuestAuth.tsx, MobileGuestLogin.tsx) |

### 6. 🧭 Multi-Route Fix — `AppShell.tsx` + Header Nav Cleanup
| Change | Details |
|--------|---------|
| **MemoryRouter initialEntries** | Passes `window.location.pathname + search` so direct URLs (`/login`, `/dashboard`, `/account`, `/guest-login`) render the correct page instead of always starting at `/` |
| **Desktop header nav** | Removed "My Account" (link to `/guest-login`) and "Staff" (link to `/login`) from the public site header — removes navigation cruft from the landing page |
| **Mobile menu nav** | Removed "My Account" and "Staff Login" from the mobile hamburger menu |
| **Guest/staff separation** | Already handled by Guard components: `Protected`/`GuestProtected`/`GuestPublic`/`PublicOnly`/`AdminOnly` — guest routes at `/account/*`, staff routes at `/dashboard/*`, login pages at `/login` and `/guest-login` |
| **Guard cross-checks** | All guards now check both `user` and `guestUser` — staff users can't access guest routes and vice versa |
| **BrowserRouter** | Switched from `MemoryRouter` back to `BrowserRouter` — real browser URLs, bookmarkable, refreshable. `mounted` guard delays mount until after TanStack Router settles, avoiding the `replaceState` conflict |

### 7. 🔐 Auth Supabase-only — No localStorage
| Change | Details |
|--------|---------|
| **Guest login** | `loginGuest` now uses `supabase.auth.signInWithPassword()` instead of local array/`guest_users` table check. Falls back to legacy `guest_users` row for pre-migration accounts (auto-migrates on first login) |
| **Guest register** | `registerGuest` creates a Supabase Auth user with `role: 'guest'` metadata, then inserts into `guest_users` table |
| **Guest logout** | `logoutGuest` calls `supabase.auth.signOut()` instead of just clearing state/localStorage |
| **Session restore** | Both staff and guest sessions restored from `supabase.auth.getSession()` on page load — no `localStorage.getItem` |
| **Property profile** | Loaded from Supabase only, no localStorage caching |
| **All localStorage removed** | `aq_guest`, `aq_guest_users`, `aq_property` — no more `localStorage.getItem`/`setItem`/`removeItem` calls in AppContext |
