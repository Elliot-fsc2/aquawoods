
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'employee', 'guest');
CREATE TYPE public.room_status AS ENUM ('available','occupied','dirty','maintenance','reserved');
CREATE TYPE public.reservation_status AS ENUM ('confirmed','checked-in','checked-out','cancelled','no-show');
CREATE TYPE public.loyalty_tier AS ENUM ('Bronze','Silver','Gold','Platinum');
CREATE TYPE public.event_status AS ENUM ('Proposal','Confirmed','In Progress','Completed');
CREATE TYPE public.guest_booking_status AS ENUM ('Pending','Confirmed','Checked-in','Checked-out','Cancelled');
CREATE TYPE public.payment_status AS ENUM ('Unpaid','Partial','Paid');
CREATE TYPE public.food_order_status AS ENUM ('Placed','Preparing','On the way','Delivered','Cancelled');
CREATE TYPE public.request_status AS ENUM ('Pending','Acknowledged','In Progress','Resolved');
CREATE TYPE public.request_priority AS ENUM ('Normal','Urgent');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  phone TEXT,
  position TEXT,
  department TEXT,
  avatar_url TEXT,
  loyalty_tier loyalty_tier NOT NULL DEFAULT 'Bronze',
  points INTEGER NOT NULL DEFAULT 0,
  joined_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','employee')
  )
$$;

-- ============ AUTO-CREATE PROFILE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'phone'
  );
  -- Default role = guest unless caller set 'role' in metadata
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'guest'::app_role)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ PROFILES RLS ============
CREATE POLICY "users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "staff can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "admins can update any profile" ON public.profiles
  FOR UPDATE USING (public.has_role(auth.uid(),'admin'));

-- ============ USER_ROLES RLS ============
CREATE POLICY "users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ ROOMS ============
CREATE TABLE public.rooms (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  floor INTEGER NOT NULL,
  type TEXT NOT NULL,
  base_rate NUMERIC NOT NULL DEFAULT 0,
  status room_status NOT NULL DEFAULT 'available',
  beds TEXT,
  capacity INTEGER NOT NULL DEFAULT 2,
  amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
  image TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER rooms_updated BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "anyone signed in can view rooms" ON public.rooms
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "public can view rooms" ON public.rooms
  FOR SELECT USING (true);
CREATE POLICY "staff manage rooms" ON public.rooms
  FOR ALL USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- ============ CRM GUESTS (historical/CRM records, separate from auth users) ============
CREATE TABLE public.crm_guests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  country TEXT,
  loyalty_tier loyalty_tier NOT NULL DEFAULT 'Bronze',
  points INTEGER NOT NULL DEFAULT 0,
  total_stays INTEGER NOT NULL DEFAULT 0,
  total_spent NUMERIC NOT NULL DEFAULT 0,
  preferences JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_stay DATE
);
ALTER TABLE public.crm_guests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage crm_guests" ON public.crm_guests
  FOR ALL USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- ============ RESERVATIONS (staff-side) ============
CREATE TABLE public.reservations (
  id TEXT PRIMARY KEY,
  guest_name TEXT NOT NULL,
  guest_id TEXT REFERENCES public.crm_guests(id) ON DELETE SET NULL,
  room_id TEXT REFERENCES public.rooms(id) ON DELETE SET NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  rate_code TEXT,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  deposit NUMERIC NOT NULL DEFAULT 0,
  status reservation_status NOT NULL DEFAULT 'confirmed',
  source TEXT,
  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage reservations" ON public.reservations
  FOR ALL USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- ============ EVENTS ============
CREATE TABLE public.events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  client TEXT,
  type TEXT,
  venue TEXT,
  date DATE,
  guests INTEGER NOT NULL DEFAULT 0,
  budget NUMERIC NOT NULL DEFAULT 0,
  status event_status NOT NULL DEFAULT 'Proposal',
  catering TEXT,
  av_requirements JSONB NOT NULL DEFAULT '[]'::jsonb
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage events" ON public.events
  FOR ALL USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- ============ CHANNELS ============
CREATE TABLE public.channels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  sync_status TEXT NOT NULL DEFAULT 'live',
  bookings_30d INTEGER NOT NULL DEFAULT 0,
  revenue_30d NUMERIC NOT NULL DEFAULT 0,
  commission_rate NUMERIC NOT NULL DEFAULT 0
);
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage channels" ON public.channels
  FOR ALL USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- ============ RATE CODES ============
CREATE TABLE public.rate_codes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  discount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true
);
ALTER TABLE public.rate_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone signed in can view rate_codes" ON public.rate_codes
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "staff manage rate_codes" ON public.rate_codes
  FOR ALL USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- ============ HOUSEKEEPING TASKS ============
CREATE TABLE public.housekeeping_tasks (
  id TEXT PRIMARY KEY,
  room TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Medium',
  assigned_to TEXT,
  task TEXT NOT NULL,
  eta TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.housekeeping_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage housekeeping_tasks" ON public.housekeeping_tasks
  FOR ALL USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- ============ PROPERTY PROFILE (single row) ============
CREATE TABLE public.property_profile (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.property_profile ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER property_profile_updated BEFORE UPDATE ON public.property_profile
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "public can view property profile" ON public.property_profile
  FOR SELECT USING (true);
CREATE POLICY "admins manage property profile" ON public.property_profile
  FOR ALL USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ GUEST BOOKINGS (online) ============
CREATE TABLE public.guest_bookings (
  id TEXT PRIMARY KEY,
  guest_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_type TEXT NOT NULL,
  room_number TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER NOT NULL DEFAULT 0,
  nights INTEGER NOT NULL DEFAULT 1,
  room_rate NUMERIC NOT NULL DEFAULT 0,
  addons JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  status guest_booking_status NOT NULL DEFAULT 'Pending',
  payment_status payment_status NOT NULL DEFAULT 'Unpaid',
  special_requests TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.guest_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guests view own bookings" ON public.guest_bookings
  FOR SELECT USING (auth.uid() = guest_user_id);
CREATE POLICY "guests insert own bookings" ON public.guest_bookings
  FOR INSERT WITH CHECK (auth.uid() = guest_user_id);
CREATE POLICY "guests update own bookings" ON public.guest_bookings
  FOR UPDATE USING (auth.uid() = guest_user_id);
CREATE POLICY "staff view all bookings" ON public.guest_bookings
  FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "staff manage all bookings" ON public.guest_bookings
  FOR ALL USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- ============ GUEST FOOD ORDERS ============
CREATE TABLE public.guest_food_orders (
  id TEXT PRIMARY KEY,
  guest_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id TEXT REFERENCES public.guest_bookings(id) ON DELETE SET NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total NUMERIC NOT NULL DEFAULT 0,
  deliver_to TEXT,
  status food_order_status NOT NULL DEFAULT 'Placed',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.guest_food_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guests view own food orders" ON public.guest_food_orders
  FOR SELECT USING (auth.uid() = guest_user_id);
CREATE POLICY "guests insert own food orders" ON public.guest_food_orders
  FOR INSERT WITH CHECK (auth.uid() = guest_user_id);
CREATE POLICY "staff manage food orders" ON public.guest_food_orders
  FOR ALL USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- ============ GUEST REQUESTS ============
CREATE TABLE public.guest_requests (
  id TEXT PRIMARY KEY,
  guest_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id TEXT REFERENCES public.guest_bookings(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  details TEXT,
  priority request_priority NOT NULL DEFAULT 'Normal',
  status request_status NOT NULL DEFAULT 'Pending',
  room_number TEXT,
  assigned_room TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
ALTER TABLE public.guest_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guests view own requests" ON public.guest_requests
  FOR SELECT USING (auth.uid() = guest_user_id);
CREATE POLICY "guests insert own requests" ON public.guest_requests
  FOR INSERT WITH CHECK (auth.uid() = guest_user_id);
CREATE POLICY "staff view all requests" ON public.guest_requests
  FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "staff update requests" ON public.guest_requests
  FOR UPDATE USING (public.is_staff(auth.uid()));

-- ============ EMERGENCY ALERTS ============
CREATE TABLE public.emergency_alerts (
  id TEXT PRIMARY KEY,
  guest_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_name TEXT,
  room_number TEXT,
  message TEXT,
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guests insert own emergency" ON public.emergency_alerts
  FOR INSERT WITH CHECK (auth.uid() = guest_user_id);
CREATE POLICY "guests view own emergency" ON public.emergency_alerts
  FOR SELECT USING (auth.uid() = guest_user_id);
CREATE POLICY "staff view all emergency" ON public.emergency_alerts
  FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "staff update emergency" ON public.emergency_alerts
  FOR UPDATE USING (public.is_staff(auth.uid()));

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.guest_bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.guest_food_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.guest_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_alerts;

-- Seed property profile row
INSERT INTO public.property_profile (id, data) VALUES (1, '{}'::jsonb)
  ON CONFLICT (id) DO NOTHING;


CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(UUID, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_staff(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;
-- Tighten reservations RLS: explicit per-command policies, staff-only
DROP POLICY IF EXISTS "staff manage reservations" ON public.reservations;

CREATE POLICY "staff select reservations"
ON public.reservations FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "staff insert reservations"
ON public.reservations FOR INSERT
TO authenticated
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "staff update reservations"
ON public.reservations FOR UPDATE
TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "staff delete reservations"
ON public.reservations FOR DELETE
TO authenticated
USING (public.is_staff(auth.uid()));

-- Server-side validation: dates and overlap protection
CREATE OR REPLACE FUNCTION public.validate_reservation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.check_out <= NEW.check_in THEN
    RAISE EXCEPTION 'check_out must be after check_in';
  END IF;

  IF NEW.room_id IS NOT NULL AND NEW.status <> 'cancelled' THEN
    IF EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.room_id = NEW.room_id
        AND r.id <> NEW.id
        AND r.status <> 'cancelled'
        AND r.check_in < NEW.check_out
        AND r.check_out > NEW.check_in
    ) THEN
      RAISE EXCEPTION 'Room % is already booked for the selected dates', NEW.room_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_reservation_trg ON public.reservations;
CREATE TRIGGER validate_reservation_trg
BEFORE INSERT OR UPDATE ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.validate_reservation();

CREATE TABLE IF NOT EXISTS public.food_products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  available BOOLEAN NOT NULL DEFAULT true,
  prep_time INTEGER NOT NULL DEFAULT 10,
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.food_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone signed in can view food_products"
  ON public.food_products FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "staff insert food_products"
  ON public.food_products FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "staff update food_products"
  ON public.food_products FOR UPDATE
  TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "staff delete food_products"
  ON public.food_products FOR DELETE
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE TRIGGER food_products_set_updated_at
  BEFORE UPDATE ON public.food_products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.food_products (id, name, category, price, description, available, prep_time, image) VALUES
  ('M-001','Lotus Spring Rolls','Appetizers',14,'Crispy rice paper with fresh herbs & sweet chili',true,10,'https://images.unsplash.com/photo-1606471191009-63994c53433b?auto=format&fit=crop&w=400&q=80'),
  ('M-002','Garden Caesar Salad','Appetizers',16,'Crisp romaine, parmesan, anchovy dressing',true,8,'https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&w=400&q=80'),
  ('M-003','Tuna Tartare','Appetizers',22,'Sashimi-grade tuna, avocado, citrus ponzu',true,12,'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'),
  ('M-004','Pan-Seared Sea Bass','Mains',38,'Mediterranean herbs, lemon caper sauce',true,25,'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&q=80'),
  ('M-005','Wagyu Beef Tenderloin','Mains',65,'8oz prime cut, truffle butter, root vegetables',true,30,'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=400&q=80'),
  ('M-006','Thai Green Curry','Mains',28,'Coconut curry with chicken, eggplant, basil',true,20,'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=400&q=80'),
  ('M-007','Margherita Pizza','Mains',22,'Wood-fired, San Marzano tomato, fresh mozzarella',true,18,'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80'),
  ('M-008','Lobster Risotto','Mains',52,'Saffron arborio, butter-poached lobster',false,28,'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=400&q=80'),
  ('M-009','Eggs Benedict','Breakfast',18,'Poached eggs, hollandaise, smoked salmon',true,15,'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&w=400&q=80'),
  ('M-010','Tropical Fruit Platter','Breakfast',14,'Mango, papaya, dragon fruit, passion fruit',true,5,'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=400&q=80'),
  ('M-011','Japanese Breakfast Set','Breakfast',24,'Grilled fish, miso soup, rice, pickles',true,18,'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80'),
  ('M-012','Crème Brûlée','Desserts',12,'Vanilla bean custard, caramelized sugar',true,8,'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?auto=format&fit=crop&w=400&q=80'),
  ('M-013','Chocolate Lava Cake','Desserts',14,'Warm chocolate cake with molten center, vanilla ice cream',true,12,'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80'),
  ('M-014','Fresh Coconut Water','Beverages',8,'Served in young coconut',true,3,'https://images.unsplash.com/photo-1502764613149-7f1d229e230f?auto=format&fit=crop&w=400&q=80'),
  ('M-015','Garden Mojito','Beverages',14,'House-grown mint, lime, white rum',true,5,'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=400&q=80'),
  ('M-016','Single-Origin Espresso','Beverages',6,'Ethiopian Yirgacheffe',true,3,'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?auto=format&fit=crop&w=400&q=80'),
  ('M-017','Truffle Fries','Sides',10,'Hand-cut, parmesan, truffle oil',true,8,'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=400&q=80'),
  ('M-018','Grilled Asparagus','Sides',9,'Lemon zest, sea salt, olive oil',true,6,'https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?auto=format&fit=crop&w=400&q=80')
ON CONFLICT (id) DO NOTHING;

-- Enable realtime for live front desk updates
ALTER TABLE public.guest_requests REPLICA IDENTITY FULL;
ALTER TABLE public.emergency_alerts REPLICA IDENTITY FULL;
ALTER TABLE public.reservations REPLICA IDENTITY FULL;
ALTER TABLE public.rooms REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.guest_requests; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_alerts; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- 1) Mirror new guest_bookings -> reservations (SECURITY DEFINER bypasses RLS for guests)
CREATE OR REPLACE FUNCTION public.mirror_guest_booking_to_reservation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guest_name TEXT;
  v_status reservation_status;
BEGIN
  SELECT COALESCE(full_name, email) INTO v_guest_name
  FROM public.profiles WHERE id = NEW.guest_user_id;

  v_status := CASE NEW.status
    WHEN 'Cancelled' THEN 'cancelled'::reservation_status
    WHEN 'Checked-in' THEN 'checked-in'::reservation_status
    WHEN 'Checked-out' THEN 'checked-out'::reservation_status
    ELSE 'confirmed'::reservation_status
  END;

  INSERT INTO public.reservations (
    id, guest_name, guest_id, room_id, check_in, check_out,
    rate_code, total_amount, deposit, status, source, adults, children, notes
  ) VALUES (
    NEW.id,
    COALESCE(v_guest_name, 'Online Guest'),
    NEW.guest_user_id::text,
    NULL, -- staff will assign at front desk
    NEW.check_in, NEW.check_out,
    NEW.room_type, NEW.total, 0,
    v_status, 'Online Portal',
    NEW.adults, NEW.children,
    NULLIF(NEW.special_requests, '')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mirror_guest_booking_insert ON public.guest_bookings;
CREATE TRIGGER trg_mirror_guest_booking_insert
AFTER INSERT ON public.guest_bookings
FOR EACH ROW EXECUTE FUNCTION public.mirror_guest_booking_to_reservation();

-- 2) Sync staff reservation changes back to guest_bookings
CREATE OR REPLACE FUNCTION public.sync_reservation_to_guest_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_number TEXT;
  v_status guest_booking_status;
BEGIN
  IF NEW.room_id IS NOT NULL THEN
    SELECT number INTO v_room_number FROM public.rooms WHERE id = NEW.room_id;
  END IF;

  v_status := CASE NEW.status
    WHEN 'cancelled' THEN 'Cancelled'::guest_booking_status
    WHEN 'checked-in' THEN 'Checked-in'::guest_booking_status
    WHEN 'checked-out' THEN 'Checked-out'::guest_booking_status
    ELSE 'Confirmed'::guest_booking_status
  END;

  UPDATE public.guest_bookings
  SET status = v_status,
      room_number = COALESCE(v_room_number, room_number)
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_reservation_to_guest_booking ON public.reservations;
CREATE TRIGGER trg_sync_reservation_to_guest_booking
AFTER UPDATE ON public.reservations
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.room_id IS DISTINCT FROM NEW.room_id)
EXECUTE FUNCTION public.sync_reservation_to_guest_booking();

-- 3) Backfill: insert any existing guest_bookings that don't have a matching reservation
INSERT INTO public.reservations (
  id, guest_name, guest_id, room_id, check_in, check_out,
  rate_code, total_amount, deposit, status, source, adults, children, notes
)
SELECT
  gb.id,
  COALESCE(p.full_name, p.email, 'Online Guest'),
  gb.guest_user_id::text,
  NULL,
  gb.check_in, gb.check_out,
  gb.room_type, gb.total, 0,
  CASE gb.status
    WHEN 'Cancelled' THEN 'cancelled'::reservation_status
    WHEN 'Checked-in' THEN 'checked-in'::reservation_status
    WHEN 'Checked-out' THEN 'checked-out'::reservation_status
    ELSE 'confirmed'::reservation_status
  END,
  'Online Portal',
  gb.adults, gb.children,
  NULLIF(gb.special_requests, '')
FROM public.guest_bookings gb
LEFT JOIN public.reservations r ON r.id = gb.id
LEFT JOIN public.profiles p ON p.id = gb.guest_user_id
WHERE r.id IS NULL;


REVOKE EXECUTE ON FUNCTION public.mirror_guest_booking_to_reservation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_reservation_to_guest_booking() FROM PUBLIC, anon, authenticated;


-- 1. Staff DELETE policy on guest_requests
CREATE POLICY "staff delete guest_requests"
  ON public.guest_requests
  FOR DELETE
  TO authenticated
  USING (public.is_staff(auth.uid()));

-- 2. Lock down SECURITY DEFINER functions: revoke EXECUTE from anon and authenticated.
-- RLS policies that call these functions still work because Postgres calls them
-- with its own privileges during policy evaluation.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.mirror_guest_booking_to_reservation() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.sync_reservation_to_guest_booking() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_reservation() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;


-- Create public storage bucket for room images
INSERT INTO storage.buckets (id, name, public)
VALUES ('room-images', 'room-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "Public can view room images"
ON storage.objects FOR SELECT
USING (bucket_id = 'room-images');

-- Staff (admin/employee) can upload
CREATE POLICY "Staff can upload room images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'room-images' AND public.is_staff(auth.uid()));

-- Staff can update
CREATE POLICY "Staff can update room images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'room-images' AND public.is_staff(auth.uid()));

-- Staff can delete
CREATE POLICY "Staff can delete room images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'room-images' AND public.is_staff(auth.uid()));

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, anon;
DELETE FROM crm_guests WHERE id LIKE 'G0%';

-- POS orders table for staff-created food orders (dine-in, room service, takeaway, banquet)
CREATE TYPE pos_order_type AS ENUM ('Dine-In', 'Room Service', 'Takeaway', 'Banquet');
CREATE TYPE pos_order_status AS ENUM ('Pending', 'Preparing', 'Ready', 'Served', 'Cancelled');
CREATE TYPE pos_payment_method AS ENUM ('Cash', 'Card', 'Room Charge', 'Mobile', 'Unpaid');

CREATE TABLE public.pos_orders (
  id TEXT PRIMARY KEY,
  type pos_order_type NOT NULL DEFAULT 'Dine-In',
  table_or_room TEXT NOT NULL DEFAULT '',
  guest_name TEXT NOT NULL DEFAULT 'Walk-in',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  service NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  status pos_order_status NOT NULL DEFAULT 'Pending',
  payment pos_payment_method NOT NULL DEFAULT 'Unpaid',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pos_orders TO authenticated;
GRANT ALL ON public.pos_orders TO service_role;

ALTER TABLE public.pos_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff manage pos_orders"
  ON public.pos_orders
  FOR ALL
  TO authenticated
  USING (is_staff(auth.uid()))
  WITH CHECK (is_staff(auth.uid()));

CREATE TRIGGER pos_orders_set_updated_at
  BEFORE UPDATE ON public.pos_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


CREATE TABLE public.venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  capacity integer NOT NULL DEFAULT 0,
  area text,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  rate numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.venues TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.venues TO authenticated;
GRANT ALL ON public.venues TO service_role;

ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Venues are viewable by everyone" ON public.venues FOR SELECT USING (true);
CREATE POLICY "Staff manage venues" ON public.venues FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER set_venues_updated_at BEFORE UPDATE ON public.venues
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.venues;

INSERT INTO public.venues (name, capacity, area, features, rate) VALUES
  ('Orchid Grand Ballroom', 400, '8,500 sq ft', '["Stage","Chandelier","Dance floor"]'::jsonb, 8500),
  ('Bamboo Conference Hall', 150, '3,200 sq ft', '["Modular seating","Built-in A/V"]'::jsonb, 3200),
  ('Executive Boardroom', 20, '650 sq ft', '["4K display","Secure WiFi"]'::jsonb, 900),
  ('Lakeside Garden', 200, '12,000 sq ft', '["Open-air","Pergola","Fountain"]'::jsonb, 6500),
  ('Garden Pavilion', 100, '2,100 sq ft', '["Glass walls","Garden view"]'::jsonb, 2800);


ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS beo jsonb;

UPDATE public.venues SET image_url = CASE name
  WHEN 'Grand Ballroom' THEN 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800'
  WHEN 'Garden Pavilion' THEN 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800'
  WHEN 'Executive Boardroom' THEN 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800'
  WHEN 'Rooftop Terrace' THEN 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800'
  WHEN 'Conference Hall A' THEN 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800'
  ELSE 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800'
END
WHERE image_url IS NULL;


-- INVENTORY
CREATE TABLE public.erp_inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE NOT NULL,
  name text NOT NULL,
  category text,
  unit text DEFAULT 'unit',
  quantity numeric NOT NULL DEFAULT 0,
  reorder_level numeric NOT NULL DEFAULT 0,
  unit_cost numeric NOT NULL DEFAULT 0,
  location text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_inventory_items TO authenticated;
GRANT ALL ON public.erp_inventory_items TO service_role;
ALTER TABLE public.erp_inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage inventory" ON public.erp_inventory_items FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_erp_inv_updated BEFORE UPDATE ON public.erp_inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- VENDORS
CREATE TABLE public.erp_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  address text,
  payment_terms text DEFAULT 'Net 30',
  tax_id text,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_vendors TO authenticated;
GRANT ALL ON public.erp_vendors TO service_role;
ALTER TABLE public.erp_vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage vendors" ON public.erp_vendors FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_erp_vendors_updated BEFORE UPDATE ON public.erp_vendors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- PURCHASE ORDERS
CREATE TABLE public.erp_purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number text UNIQUE NOT NULL,
  vendor_id uuid REFERENCES public.erp_vendors(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft',
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  expected_date date,
  received_date date,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_purchase_orders TO authenticated;
GRANT ALL ON public.erp_purchase_orders TO service_role;
ALTER TABLE public.erp_purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage POs" ON public.erp_purchase_orders FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_erp_po_updated BEFORE UPDATE ON public.erp_purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- EMPLOYEES
CREATE TABLE public.erp_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code text UNIQUE NOT NULL,
  full_name text NOT NULL,
  email text,
  phone text,
  department text,
  position text,
  hire_date date NOT NULL DEFAULT CURRENT_DATE,
  pay_type text NOT NULL DEFAULT 'salary',
  base_salary numeric NOT NULL DEFAULT 0,
  hourly_rate numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_employees TO authenticated;
GRANT ALL ON public.erp_employees TO service_role;
ALTER TABLE public.erp_employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage employees" ON public.erp_employees FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_erp_emp_updated BEFORE UPDATE ON public.erp_employees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- PAYROLL RUNS
CREATE TABLE public.erp_payroll_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.erp_employees(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  hours_worked numeric NOT NULL DEFAULT 0,
  gross_pay numeric NOT NULL DEFAULT 0,
  deductions numeric NOT NULL DEFAULT 0,
  net_pay numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_payroll_runs TO authenticated;
GRANT ALL ON public.erp_payroll_runs TO service_role;
ALTER TABLE public.erp_payroll_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage payroll" ON public.erp_payroll_runs FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_erp_payroll_updated BEFORE UPDATE ON public.erp_payroll_runs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed sample data
INSERT INTO public.erp_vendors (name, contact_name, email, phone, payment_terms) VALUES
  ('Sysco Foods', 'Mark Johnson', 'mark@sysco.com', '555-0101', 'Net 30'),
  ('Linen Supply Co', 'Sarah Chen', 'sarah@linenco.com', '555-0102', 'Net 15'),
  ('CleanPro Chemicals', 'Tom Diaz', 'tom@cleanpro.com', '555-0103', 'Net 30');

INSERT INTO public.erp_inventory_items (sku, name, category, unit, quantity, reorder_level, unit_cost, location) VALUES
  ('LIN-TWL-001', 'Bath Towels (White)', 'Linen', 'pcs', 240, 100, 8.50, 'Storage A'),
  ('LIN-SHT-001', 'King Bed Sheets', 'Linen', 'set', 80, 40, 24.00, 'Storage A'),
  ('AMN-SHM-001', 'Shampoo 30ml', 'Amenities', 'btl', 1200, 500, 0.65, 'Storage B'),
  ('AMN-SOA-001', 'Bar Soap 25g', 'Amenities', 'pcs', 950, 500, 0.40, 'Storage B'),
  ('FNB-COF-001', 'Coffee Beans (kg)', 'F&B', 'kg', 45, 20, 18.00, 'Kitchen'),
  ('CLN-DET-001', 'All-Purpose Cleaner', 'Cleaning', 'gal', 18, 10, 12.50, 'Storage C');

INSERT INTO public.erp_employees (employee_code, full_name, email, department, position, pay_type, base_salary, hourly_rate) VALUES
  ('EMP-001', 'Alice Martinez', 'alice@hotel.com', 'Front Desk', 'Manager', 'salary', 4800, 0),
  ('EMP-002', 'Brian Kim', 'brian@hotel.com', 'Housekeeping', 'Supervisor', 'salary', 3600, 0),
  ('EMP-003', 'Carla Singh', 'carla@hotel.com', 'F&B', 'Server', 'hourly', 0, 18.50),
  ('EMP-004', 'David Park', 'david@hotel.com', 'Maintenance', 'Technician', 'hourly', 0, 22.00);


-- ============ GUEST USERS TABLE (local-password guests) ============
CREATE TABLE IF NOT EXISTS public.guest_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  password TEXT NOT NULL,
  avatar_url TEXT,
  loyalty_tier public.loyalty_tier NOT NULL DEFAULT 'Bronze',
  points INTEGER NOT NULL DEFAULT 0,
  joined_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.guest_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guest users view own" ON public.guest_users
  FOR SELECT USING (email = current_setting('request.jwt.claims', true)::json->>'email' OR public.is_staff(auth.uid()));
CREATE POLICY "guest users insert own" ON public.guest_users
  FOR INSERT WITH CHECK (true);
CREATE POLICY "guest users update own" ON public.guest_users
  FOR UPDATE USING (email = current_setting('request.jwt.claims', true)::json->>'email');
CREATE POLICY "staff manage guest users" ON public.guest_users
  FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER trg_guest_users_updated BEFORE UPDATE ON public.guest_users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ GUEST FOOD ORDERS — ADD RLS for staff ============
-- (Table already exists; ensure proper staff read access)
ALTER TABLE public.guest_food_orders ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'guest_food_orders' AND policyname = 'staff view all food orders'
  ) THEN
    CREATE POLICY "staff view all food orders" ON public.guest_food_orders
      FOR SELECT USING (public.is_staff(auth.uid()));
  END IF;
END
$$;

-- ============ PROPERTY PROFILE — ADD guest_users reference to guest_bookings ============
-- Relax guest_bookings FK: allow guest_user_id to reference guest_users OR auth.users
ALTER TABLE public.guest_bookings
  DROP CONSTRAINT IF EXISTS guest_bookings_guest_user_id_fkey;

ALTER TABLE public.guest_bookings
  ADD CONSTRAINT guest_bookings_guest_user_id_fkey
  FOREIGN KEY (guest_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============ CHANNELS SYNC STATUS ENUM ============
DO $$ BEGIN
  CREATE TYPE public.sync_status AS ENUM ('live', 'delayed', 'offline');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.channels
  ALTER COLUMN sync_status TYPE text;

-- ============ REALTIME — ensure missing tables are published ============
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.guest_users; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.guest_food_orders; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.channels; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.rate_codes; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.housekeeping_tasks; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.events; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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

