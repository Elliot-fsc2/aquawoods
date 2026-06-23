# Aquawood Garden Resort — Database Schema

## Enums

| Name | Values |
|------|--------|
| `app_role` | `admin`, `employee`, `guest` |
| `room_status` | `available`, `occupied`, `dirty`, `maintenance`, `reserved` |
| `reservation_status` | `confirmed`, `checked-in`, `checked-out`, `cancelled`, `no-show` |
| `loyalty_tier` | `Bronze`, `Silver`, `Gold`, `Platinum` |
| `event_status` | `Proposal`, `Confirmed`, `In Progress`, `Completed` |
| `guest_booking_status` | `Pending`, `Confirmed`, `Checked-in`, `Checked-out`, `Cancelled` |
| `payment_status` | `Unpaid`, `Partial`, `Paid` |
| `food_order_status` | `Placed`, `Preparing`, `On the way`, `Delivered`, `Cancelled` |
| `request_status` | `Pending`, `Acknowledged`, `In Progress`, `Resolved` |
| `request_priority` | `Normal`, `Urgent` |
| `pos_order_type` | `Dine-In`, `Room Service`, `Takeaway`, `Banquet` |
| `pos_order_status` | `Pending`, `Preparing`, `Ready`, `Served`, `Cancelled` |
| `pos_payment_method` | `Cash`, `Card`, `Room Charge`, `Mobile`, `Unpaid` |

---

## Tables (27 total)

### Auth / Staff

#### `profiles`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, FK → auth.users(id) ON DELETE CASCADE |
| full_name | TEXT | NOT NULL DEFAULT '' |
| email | TEXT | NOT NULL |
| phone | TEXT | nullable |
| position | TEXT | nullable |
| department | TEXT | nullable |
| avatar_url | TEXT | nullable |
| loyalty_tier | loyalty_tier | NOT NULL DEFAULT 'Bronze' |
| points | INTEGER | NOT NULL DEFAULT 0 |
| joined_at | DATE | NOT NULL DEFAULT CURRENT_DATE |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

Auto-created on auth signup via `handle_new_user()` trigger.

#### `user_roles`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK DEFAULT gen_random_uuid() |
| user_id | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE |
| role | app_role | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

UNIQUE(user_id, role)

#### `employees` (hotel staff records, separate from auth)
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PK |
| name | TEXT | NOT NULL |
| position | TEXT | NOT NULL |
| department | TEXT | NOT NULL |
| email | TEXT | nullable |
| phone | TEXT | nullable |
| shift | TEXT | nullable |
| status | TEXT | NOT NULL DEFAULT 'Active', CHECK IN ('Active','On Leave','Inactive') |

---

### Property

#### `property_profile` (single-row)
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PK DEFAULT 1, CHECK (id = 1) |
| data | JSONB | NOT NULL DEFAULT '{}' |

---

### Rooms & Inventory

#### `rooms`
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PK |
| number | TEXT | NOT NULL |
| floor | INTEGER | NOT NULL |
| type | TEXT | NOT NULL |
| base_rate | NUMERIC | NOT NULL DEFAULT 0 |
| status | room_status | NOT NULL DEFAULT 'available' |
| beds | TEXT | nullable |
| capacity | INTEGER | NOT NULL DEFAULT 2 |
| amenities | JSONB | NOT NULL DEFAULT '[]' |
| image | TEXT | nullable |

#### `floors`
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PK |
| name | TEXT | NOT NULL |
| level | INTEGER | NOT NULL |
| description | TEXT | nullable |
| room_count | INTEGER | NOT NULL DEFAULT 0 |

#### `room_categories`
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PK |
| name | TEXT | NOT NULL |
| floor_id | TEXT | FK → floors(id) ON DELETE SET NULL, nullable |
| base_price | NUMERIC | NOT NULL DEFAULT 0 |
| capacity | INTEGER | NOT NULL DEFAULT 2 |
| quantity | INTEGER | NOT NULL DEFAULT 0 |
| amenities | TEXT | nullable |
| image | TEXT | nullable |

#### `channels`
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PK |
| name | TEXT | NOT NULL |
| logo | TEXT | nullable |
| sync_status | TEXT | NOT NULL DEFAULT 'live' |
| bookings_30d | INTEGER | NOT NULL DEFAULT 0 |
| revenue_30d | NUMERIC | NOT NULL DEFAULT 0 |
| commission_rate | NUMERIC | NOT NULL DEFAULT 0 |

#### `rate_codes`
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PK |
| name | TEXT | NOT NULL |
| discount | NUMERIC | NOT NULL DEFAULT 0 |
| description | TEXT | nullable |
| active | BOOLEAN | NOT NULL DEFAULT true |

---

### CRM & Guests

#### `crm_guests` (historical/CRM records)
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PK |
| name | TEXT | NOT NULL |
| email | TEXT | nullable |
| phone | TEXT | nullable |
| country | TEXT | nullable |
| loyalty_tier | loyalty_tier | NOT NULL DEFAULT 'Bronze' |
| points | INTEGER | NOT NULL DEFAULT 0 |
| total_stays | INTEGER | NOT NULL DEFAULT 0 |
| total_spent | NUMERIC | NOT NULL DEFAULT 0 |
| preferences | JSONB | NOT NULL DEFAULT '[]' |
| last_stay | DATE | nullable |

#### `guest_users` (online portal accounts)
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PK |
| name | TEXT | NOT NULL |
| email | TEXT | NOT NULL |
| phone | TEXT | DEFAULT '' |
| password | TEXT | NOT NULL |
| avatar_url | TEXT | nullable |
| loyalty_tier | loyalty_tier | NOT NULL DEFAULT 'Bronze' |
| points | INTEGER | NOT NULL DEFAULT 0 |
| joined_at | DATE | NOT NULL DEFAULT CURRENT_DATE |

---

### Reservations & Bookings

#### `reservations` (staff-side)
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PK |
| guest_name | TEXT | NOT NULL |
| guest_id | TEXT | FK → crm_guests(id) ON DELETE SET NULL, nullable |
| room_id | TEXT | FK → rooms(id) ON DELETE SET NULL, nullable |
| check_in | DATE | NOT NULL |
| check_out | DATE | NOT NULL |
| rate_code | TEXT | nullable |
| total_amount | NUMERIC | NOT NULL DEFAULT 0 |
| deposit | NUMERIC | NOT NULL DEFAULT 0 |
| status | reservation_status | NOT NULL DEFAULT 'confirmed' |
| source | TEXT | nullable |
| adults | INTEGER | NOT NULL DEFAULT 1 |
| children | INTEGER | NOT NULL DEFAULT 0 |
| notes | TEXT | nullable |

Server-side trigger validates check_out > check_in and prevents room double-booking.

#### `guest_bookings` (online portal)
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PK |
| guest_user_id | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE |
| room_type | TEXT | NOT NULL |
| room_number | TEXT | nullable |
| check_in | DATE | NOT NULL |
| check_out | DATE | NOT NULL |
| adults | INTEGER | NOT NULL DEFAULT 1 |
| children | INTEGER | NOT NULL DEFAULT 0 |
| nights | INTEGER | NOT NULL DEFAULT 1 |
| room_rate | NUMERIC | NOT NULL DEFAULT 0 |
| addons | JSONB | NOT NULL DEFAULT '[]' |
| subtotal | NUMERIC | NOT NULL DEFAULT 0 |
| tax | NUMERIC | NOT NULL DEFAULT 0 |
| total | NUMERIC | NOT NULL DEFAULT 0 |
| status | guest_booking_status | NOT NULL DEFAULT 'Pending' |
| payment_status | payment_status | NOT NULL DEFAULT 'Unpaid' |
| special_requests | TEXT | nullable |

Trigger `trg_mirror_guest_booking_insert` mirrors INSERT into `reservations`.

---

### F&B

#### `food_products`
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PK |
| name | TEXT | NOT NULL |
| category | TEXT | NOT NULL |
| price | NUMERIC | NOT NULL DEFAULT 0 |
| description | TEXT | NOT NULL DEFAULT '' |
| available | BOOLEAN | NOT NULL DEFAULT true |
| prep_time | INTEGER | NOT NULL DEFAULT 10 |
| image | TEXT | nullable |

#### `pos_orders` (staff-created orders)
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PK |
| type | pos_order_type | NOT NULL DEFAULT 'Dine-In' |
| table_or_room | TEXT | NOT NULL DEFAULT '' |
| guest_name | TEXT | NOT NULL DEFAULT 'Walk-in' |
| items | JSONB | NOT NULL DEFAULT '[]' |
| subtotal | NUMERIC | NOT NULL DEFAULT 0 |
| tax | NUMERIC | NOT NULL DEFAULT 0 |
| service | NUMERIC | NOT NULL DEFAULT 0 |
| total | NUMERIC | NOT NULL DEFAULT 0 |
| status | pos_order_status | NOT NULL DEFAULT 'Pending' |
| payment | pos_payment_method | NOT NULL DEFAULT 'Unpaid' |
| notes | TEXT | nullable |

#### `guest_food_orders` (guest portal)
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PK |
| guest_user_id | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE |
| booking_id | TEXT | FK → guest_bookings(id) ON DELETE SET NULL, nullable |
| items | JSONB | NOT NULL DEFAULT '[]' |
| total | NUMERIC | NOT NULL DEFAULT 0 |
| deliver_to | TEXT | nullable |
| status | food_order_status | NOT NULL DEFAULT 'Placed' |
| notes | TEXT | nullable |

---

### Guest Services

#### `guest_requests`
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PK |
| guest_user_id | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE |
| booking_id | TEXT | FK → guest_bookings(id) ON DELETE SET NULL, nullable |
| type | TEXT | NOT NULL |
| title | TEXT | NOT NULL |
| details | TEXT | nullable |
| priority | request_priority | NOT NULL DEFAULT 'Normal' |
| status | request_status | NOT NULL DEFAULT 'Pending' |
| room_number | TEXT | nullable |
| assigned_room | TEXT | nullable |
| resolved_at | TIMESTAMPTZ | nullable |

#### `emergency_alerts`
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PK |
| guest_user_id | UUID | FK → auth.users(id) ON DELETE SET NULL, nullable |
| guest_name | TEXT | nullable |
| room_number | TEXT | nullable |
| message | TEXT | nullable |
| acknowledged | BOOLEAN | NOT NULL DEFAULT false |

---

### Events

#### `events`
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PK |
| title | TEXT | NOT NULL |
| client | TEXT | nullable |
| type | TEXT | nullable |
| venue | TEXT | nullable |
| date | DATE | nullable |
| guests | INTEGER | NOT NULL DEFAULT 0 |
| budget | NUMERIC | NOT NULL DEFAULT 0 |
| status | event_status | NOT NULL DEFAULT 'Proposal' |
| catering | TEXT | nullable |
| av_requirements | JSONB | NOT NULL DEFAULT '[]' |
| beo | JSONB | nullable |

#### `venues`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK DEFAULT gen_random_uuid() |
| name | TEXT | NOT NULL, UNIQUE |
| capacity | INTEGER | NOT NULL DEFAULT 0 |
| area | TEXT | nullable |
| features | JSONB | NOT NULL DEFAULT '[]' |
| rate | NUMERIC | NOT NULL DEFAULT 0 |
| active | BOOLEAN | NOT NULL DEFAULT true |
| image_url | TEXT | nullable |

---

### Accounting

#### `accounting_entries`
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PK |
| date | DATE | NOT NULL DEFAULT CURRENT_DATE |
| description | TEXT | NOT NULL |
| category | TEXT | NOT NULL |
| type | TEXT | NOT NULL, CHECK IN ('Income','Expense') |
| amount | NUMERIC | NOT NULL DEFAULT 0 |
| method | TEXT | NOT NULL DEFAULT 'Cash' |
| reference | TEXT | nullable |

---

### Housekeeping

#### `housekeeping_tasks`
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PK |
| room | TEXT | NOT NULL |
| priority | TEXT | NOT NULL DEFAULT 'Medium' |
| assigned_to | TEXT | nullable |
| task | TEXT | NOT NULL |
| eta | TEXT | nullable |
| status | TEXT | NOT NULL DEFAULT 'Pending' |

---

### ERP

#### `erp_inventory_items`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK DEFAULT gen_random_uuid() |
| sku | TEXT | UNIQUE NOT NULL |
| name | TEXT | NOT NULL |
| category | TEXT | nullable |
| unit | TEXT | DEFAULT 'unit' |
| quantity | NUMERIC | NOT NULL DEFAULT 0 |
| reorder_level | NUMERIC | NOT NULL DEFAULT 0 |
| unit_cost | NUMERIC | NOT NULL DEFAULT 0 |
| location | TEXT | nullable |
| active | BOOLEAN | NOT NULL DEFAULT true |

#### `erp_vendors`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK DEFAULT gen_random_uuid() |
| name | TEXT | NOT NULL |
| contact_name | TEXT | nullable |
| email | TEXT | nullable |
| phone | TEXT | nullable |
| address | TEXT | nullable |
| payment_terms | TEXT | DEFAULT 'Net 30' |
| tax_id | TEXT | nullable |
| notes | TEXT | nullable |
| active | BOOLEAN | NOT NULL DEFAULT true |

#### `erp_purchase_orders`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK DEFAULT gen_random_uuid() |
| po_number | TEXT | UNIQUE NOT NULL |
| vendor_id | UUID | FK → erp_vendors(id) ON DELETE SET NULL, nullable |
| status | TEXT | NOT NULL DEFAULT 'draft' |
| order_date | DATE | NOT NULL DEFAULT CURRENT_DATE |
| expected_date | DATE | nullable |
| received_date | DATE | nullable |
| items | JSONB | NOT NULL DEFAULT '[]' |
| subtotal | NUMERIC | NOT NULL DEFAULT 0 |
| tax | NUMERIC | NOT NULL DEFAULT 0 |
| total | NUMERIC | NOT NULL DEFAULT 0 |
| notes | TEXT | nullable |

#### `erp_employees`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK DEFAULT gen_random_uuid() |
| employee_code | TEXT | UNIQUE NOT NULL |
| full_name | TEXT | NOT NULL |
| email | TEXT | nullable |
| phone | TEXT | nullable |
| department | TEXT | nullable |
| position | TEXT | nullable |
| hire_date | DATE | NOT NULL DEFAULT CURRENT_DATE |
| pay_type | TEXT | NOT NULL DEFAULT 'salary' |
| base_salary | NUMERIC | NOT NULL DEFAULT 0 |
| hourly_rate | NUMERIC | NOT NULL DEFAULT 0 |
| status | TEXT | NOT NULL DEFAULT 'active' |

#### `erp_payroll_runs`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK DEFAULT gen_random_uuid() |
| employee_id | UUID | FK → erp_employees(id) ON DELETE CASCADE, nullable |
| period_start | DATE | NOT NULL |
| period_end | DATE | NOT NULL |
| hours_worked | NUMERIC | NOT NULL DEFAULT 0 |
| gross_pay | NUMERIC | NOT NULL DEFAULT 0 |
| deductions | NUMERIC | NOT NULL DEFAULT 0 |
| net_pay | NUMERIC | NOT NULL DEFAULT 0 |
| status | TEXT | NOT NULL DEFAULT 'pending' |
| paid_at | TIMESTAMPTZ | nullable |
| notes | TEXT | nullable |

---

## Key Relationships Diagram

```
auth.users
  ├── profiles (1:1, CASCADE)
  ├── user_roles (1:N, CASCADE)
  ├── guest_bookings (1:N, CASCADE)
  ├── guest_food_orders (1:N, CASCADE)
  ├── guest_requests (1:N, CASCADE)
  └── emergency_alerts (1:N, SET NULL)

floors
  └── room_categories (1:N, SET NULL)

rooms
  └── reservations (1:N, SET NULL)

crm_guests
  └── reservations (1:N, SET NULL)

guest_bookings
  ├── guest_food_orders (1:N, SET NULL)
  └── guest_requests (1:N, SET NULL)

erp_vendors
  └── erp_purchase_orders (1:N, SET NULL)

erp_employees
  └── erp_payroll_runs (1:N, CASCADE)
```

---

## Database Triggers

| Name | Event | Purpose |
|------|-------|---------|
| `on_auth_user_created` | AFTER INSERT ON auth.users | Auto-creates profile + user_role |
| `validate_reservation_trg` | BEFORE INSERT/UPDATE ON reservations | Validates dates and prevents room double-booking |
| `trg_mirror_guest_booking_insert` | AFTER INSERT ON guest_bookings | Mirrors guest booking into reservations table |
| `trg_sync_reservation_to_guest_booking` | AFTER UPDATE ON reservations | Syncs reservation status back to guest_bookings |
| `*_updated` (per table) | BEFORE UPDATE | Sets updated_at = now() |

---

## Seed Data

All seed data is in `supabase/migrations/`:

### Food Products (18 items) — `20260523231922`
M-001 through M-018: Appetizers, Mains, Breakfast, Desserts, Beverages, Sides

### Venues (5 items) — `20260609114229`
Orchid Grand Ballroom, Bamboo Conference Hall, Executive Boardroom, Lakeside Garden, Garden Pavilion

### ERP Vendors (3) + Inventory (6) + ERP Employees (4) — `20260612014022`

### Accounting Entries (10) — `20260618000001`
JE-001 through JE-010

### Floors (4) — `20260618000001`
Ground Floor (FL-1), Garden Level (FL-2), Lagoon Level (FL-3), Sky Level (FL-4)

### Room Categories (5) — `20260618000001`
Standard, Deluxe Garden, Lagoon Suite, Family Villa, Presidential Suite

### Hotel Employees (8) — `20260618000001`
EMP-001 through EMP-008

### Housekeeping Tasks (6) — `20260618000001`
HK-001 through HK-006

---

## Storage

**Bucket:** `room-images` (public)
- Public read, staff upload/update/delete

---

## Migration Order

The 18 migration files run in this order (filename-sorted):

1. `20260519180852` — Core enums, profiles, user_roles, rooms, crm_guests, reservations, events, channels, rate_codes, housekeeping_tasks, property_profile, guest_bookings, guest_food_orders, guest_requests, emergency_alerts
2. `20260519180921` — Revoke function execute permissions
3. `20260523225730` — Grant is_staff/has_role to authenticated
4. `20260523230211` — Reservations RLS per-command + validate_reservation trigger
5. `20260523231922` — food_products table + 18 seed items
6. `20260524003800` — Realtime subscriptions + REPLICA IDENTITY FULL
7. `20260524095607` — Mirror guest_bookings → reservations trigger + backfill
8. `20260524095634` — Revoke mirror/sync functions from public
9. `20260524104803` — Staff DELETE policy on guest_requests + revoke all security definer functions
10. `20260524110025` — Re-grant is_staff/has_role
11. `20260524114837` — Cleanup seed guest IDs
12. `20260530003248` — POS orders table + enums
13. `20260609114229` — Venues table + 5 seed venues
14. `20260610045528` — Add image_url to venues, beo to events
15. `20260612014022` — ERP tables (inventory, vendors, POs, employees, payroll) + seeds
16. `20260618000000` — guest_users table, FK fix, sync_status enum attempt, realtime additions
17. `20260618000001` — accounting_entries, floors, room_categories, employees + all seeds
