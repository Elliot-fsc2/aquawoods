
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
