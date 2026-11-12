CREATE TRIGGER IF NOT EXISTS occupancy_requires_confirmed_booking
BEFORE INSERT ON occupancy
WHEN NOT EXISTS (SELECT 1 FROM bookings WHERE id=NEW.booking AND status='confirmed')
BEGIN
 SELECT RAISE(ABORT, 'booking_not_confirmed');
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS cancelled_booking_releases_occupancy
AFTER UPDATE OF status ON bookings
WHEN NEW.status <> 'confirmed'
BEGIN
 DELETE FROM occupancy WHERE booking=NEW.id;
END;
