
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
