-- Fix mirror trigger: guest_id FK references crm_guests(id), but
-- guest users don't have a crm_guests row. Set guest_id to NULL
-- to avoid FK violation that rolls back the entire transaction.

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
    NULL, -- guest_id FK to crm_guests — set NULL for portal bookings
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
