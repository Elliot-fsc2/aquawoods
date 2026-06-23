
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
