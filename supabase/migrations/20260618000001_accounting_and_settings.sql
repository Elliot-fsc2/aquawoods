-- ============ ACCOUNTING ENTRIES ============
CREATE TABLE public.accounting_entries (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Income','Expense')),
  amount NUMERIC NOT NULL DEFAULT 0,
  method TEXT NOT NULL DEFAULT 'Cash',
  reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.accounting_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff manage accounting_entries" ON public.accounting_entries
  FOR ALL USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER trg_accounting_entries_updated BEFORE UPDATE ON public.accounting_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed sample entries
INSERT INTO public.accounting_entries (id, date, description, category, type, amount, method, reference) VALUES
  ('JE-001', '2026-03-01', 'Room 204 — 3 nights', 'Room Revenue', 'Income', 13500, 'GCash', 'BK-100021'),
  ('JE-002', '2026-03-01', 'Food order FO-2401', 'F&B Revenue', 'Income', 720, 'Room Charge', 'FO-2401'),
  ('JE-003', '2026-03-01', 'Payroll — March Week 1', 'Payroll', 'Expense', 180000, 'Bank Transfer', 'PAY-0301'),
  ('JE-004', '2026-03-02', 'Utility — Electricity (Meralco)', 'Utilities', 'Expense', 42000, 'Online Banking', 'UT-0302'),
  ('JE-005', '2026-03-02', 'Room 305 — 2 nights', 'Room Revenue', 'Income', 15600, 'Card', 'BK-099812'),
  ('JE-006', '2026-03-03', 'Restaurant supplies', 'F&B Supplies', 'Expense', 28000, 'Cash', 'PO-0303'),
  ('JE-007', '2026-03-03', 'Spa service charge', 'Spa Revenue', 'Income', 3500, 'GCash', 'SP-0303'),
  ('JE-008', '2026-03-04', 'Linen & laundry service', 'Maintenance', 'Expense', 15000, 'Bank Transfer', 'MT-0304'),
  ('JE-009', '2026-03-04', 'Event — Chen & Park deposit', 'Events Revenue', 'Income', 85000, 'Bank Transfer', 'EVT-201'),
  ('JE-010', '2026-03-05', 'Internet — PLDT', 'Utilities', 'Expense', 4500, 'GCash', 'UT-0305');

-- ============ FLOORS ============
CREATE TABLE public.floors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  level INTEGER NOT NULL,
  description TEXT,
  room_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.floors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage floors" ON public.floors
  FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_floors_updated BEFORE UPDATE ON public.floors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.floors (id, name, level, description, room_count) VALUES
  ('FL-1', 'Ground Floor', 1, 'Lobby, reception & accessible rooms', 7),
  ('FL-2', 'Garden Level', 2, 'Garden-view deluxe rooms', 7),
  ('FL-3', 'Lagoon Level', 3, 'Lagoon-view suites & villas', 7),
  ('FL-4', 'Sky Level', 4, 'Presidential suites & penthouse', 7);

-- ============ ROOM CATEGORIES ============
CREATE TABLE public.room_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  floor_id TEXT REFERENCES public.floors(id) ON DELETE SET NULL,
  base_price NUMERIC NOT NULL DEFAULT 0,
  capacity INTEGER NOT NULL DEFAULT 2,
  quantity INTEGER NOT NULL DEFAULT 0,
  amenities TEXT,
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.room_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage room_categories" ON public.room_categories
  FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "anyone can view room_categories" ON public.room_categories
  FOR SELECT USING (true);
CREATE TRIGGER trg_room_categories_updated BEFORE UPDATE ON public.room_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.room_categories (id, name, floor_id, base_price, capacity, quantity, amenities) VALUES
  ('RC-1', 'Standard', 'FL-1', 145, 2, 6, 'WiFi, Smart TV, Mini Bar'),
  ('RC-2', 'Deluxe Garden', 'FL-2', 225, 2, 7, 'WiFi, Garden View, Balcony'),
  ('RC-3', 'Lagoon Suite', 'FL-3', 385, 3, 5, 'Lagoon View, Jacuzzi, Living Area'),
  ('RC-4', 'Family Villa', 'FL-3', 495, 5, 4, 'Private Pool, Kitchen, Kids Corner'),
  ('RC-5', 'Presidential Suite', 'FL-4', 895, 2, 2, 'Butler Service, Private Terrace');

-- ============ EMPLOYEES (hotel staff records, separate from auth users) ============
CREATE TABLE public.employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  department TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  shift TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','On Leave','Inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage employees" ON public.employees
  FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_employees_updated BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.employees (id, name, position, department, email, phone, shift, status) VALUES
  ('EMP-001', 'Elena Vasquez', 'General Manager', 'Executive', 'elena@aquawood.com', '+66 81 555 0100', 'Day (9-6)', 'Active'),
  ('EMP-002', 'Sarah Chen', 'Front Desk Agent', 'Front Office', 'sarah@aquawood.com', '+66 81 555 0101', 'Morning (6-2)', 'Active'),
  ('EMP-003', 'David Kumar', 'Sales Manager', 'Sales & Marketing', 'david@aquawood.com', '+66 81 555 0102', 'Day (9-6)', 'Active'),
  ('EMP-004', 'Maria Santos', 'Housekeeping Lead', 'Housekeeping', 'maria@aquawood.com', '+66 81 555 0103', 'Morning (6-2)', 'Active'),
  ('EMP-005', 'Juan Perez', 'Room Attendant', 'Housekeeping', 'juan@aquawood.com', '+66 81 555 0104', 'Afternoon (2-10)', 'Active'),
  ('EMP-006', 'Aisha Khan', 'Room Attendant', 'Housekeeping', 'aisha@aquawood.com', '+66 81 555 0105', 'Morning (6-2)', 'On Leave'),
  ('EMP-007', 'Chef Marco', 'Executive Chef', 'F&B', 'marco@aquawood.com', '+66 81 555 0106', 'Day (9-9)', 'Active'),
  ('EMP-008', 'Carlos Mendez', 'Concierge', 'Front Office', 'carlos@aquawood.com', '+66 81 555 0107', 'Evening (2-10)', 'Active');

-- ============ ADD STATUS COLUMN TO HOUSEKEEPING TASKS ============
DO $$ BEGIN
  ALTER TABLE public.housekeeping_tasks ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Pending';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Seed data for housekeeping tasks (if table is empty)
INSERT INTO public.housekeeping_tasks (id, room, priority, assigned_to, task, eta, status)
SELECT * FROM (VALUES
  ('HK-001', '108', 'High', 'Maria Santos', 'Deep Clean + Turndown', '2:30 PM', 'In Progress'),
  ('HK-002', '114', 'Medium', 'Juan Perez', 'Standard Clean', '3:00 PM', 'Pending'),
  ('HK-003', '102', 'High', 'Aisha Khan', 'Check-out Clean', '1:45 PM', 'Pending'),
  ('HK-004', '116', 'Low', 'Maria Santos', 'Linen Refresh', '12:00 PM', 'Completed'),
  ('HK-005', '122', 'Medium', 'Carlos Mendez', 'Mini-bar Restock', '3:30 PM', 'In Progress'),
  ('HK-006', '106', 'High', 'Juan Perez', 'VIP Turndown', '2:00 PM', 'Pending')
) AS v(id, room, priority, assigned_to, task, eta, status)
WHERE NOT EXISTS (SELECT 1 FROM public.housekeeping_tasks);

-- ============ REALTIME ============
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.accounting_entries; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.floors; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.room_categories; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.employees; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
