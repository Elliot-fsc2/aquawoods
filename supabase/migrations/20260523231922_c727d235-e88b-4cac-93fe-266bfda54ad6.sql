
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
