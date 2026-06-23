
-- 1. Staff DELETE policy on guest_requests
CREATE POLICY "staff delete guest_requests"
  ON public.guest_requests
  FOR DELETE
  TO authenticated
  USING (public.is_staff(auth.uid()));

-- 2. Lock down SECURITY DEFINER functions: revoke EXECUTE from anon and authenticated.
-- RLS policies that call these functions still work because Postgres calls them
-- with its own privileges during policy evaluation.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.mirror_guest_booking_to_reservation() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.sync_reservation_to_guest_booking() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_reservation() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;
