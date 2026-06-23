
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
