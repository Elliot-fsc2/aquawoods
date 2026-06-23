
REVOKE EXECUTE ON FUNCTION public.mirror_guest_booking_to_reservation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_reservation_to_guest_booking() FROM PUBLIC, anon, authenticated;
