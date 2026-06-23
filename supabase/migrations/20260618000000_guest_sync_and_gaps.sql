
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
