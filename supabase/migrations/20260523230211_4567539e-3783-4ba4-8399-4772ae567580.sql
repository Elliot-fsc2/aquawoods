-- Tighten reservations RLS: explicit per-command policies, staff-only
DROP POLICY IF EXISTS "staff manage reservations" ON public.reservations;

CREATE POLICY "staff select reservations"
ON public.reservations FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "staff insert reservations"
ON public.reservations FOR INSERT
TO authenticated
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "staff update reservations"
ON public.reservations FOR UPDATE
TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "staff delete reservations"
ON public.reservations FOR DELETE
TO authenticated
USING (public.is_staff(auth.uid()));

-- Server-side validation: dates and overlap protection
CREATE OR REPLACE FUNCTION public.validate_reservation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.check_out <= NEW.check_in THEN
    RAISE EXCEPTION 'check_out must be after check_in';
  END IF;

  IF NEW.room_id IS NOT NULL AND NEW.status <> 'cancelled' THEN
    IF EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.room_id = NEW.room_id
        AND r.id <> NEW.id
        AND r.status <> 'cancelled'
        AND r.check_in < NEW.check_out
        AND r.check_out > NEW.check_in
    ) THEN
      RAISE EXCEPTION 'Room % is already booked for the selected dates', NEW.room_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_reservation_trg ON public.reservations;
CREATE TRIGGER validate_reservation_trg
BEFORE INSERT OR UPDATE ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.validate_reservation();