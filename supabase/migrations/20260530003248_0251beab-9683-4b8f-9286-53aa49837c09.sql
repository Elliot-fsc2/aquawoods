
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
