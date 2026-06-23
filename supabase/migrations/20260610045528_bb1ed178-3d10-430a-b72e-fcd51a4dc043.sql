
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
