
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
