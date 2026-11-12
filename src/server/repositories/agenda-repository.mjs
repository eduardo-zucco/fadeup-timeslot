// SQL and atomic writes stay here; services do not depend on the database adapter.
export function createAgendaRepository(db) {
  const occupancy = (id, date, minutes) => minutes.map(minute => db.prepare('INSERT INTO occupancy(date,minute,booking) VALUES(?,?,?)').bind(date, minute, id));
  const cancelMessages = id => db.prepare("UPDATE outbox SET status='cancelled' WHERE booking=? AND status='pending'").bind(id);
  const messages = items => items.map(item => db.prepare("INSERT INTO outbox(id,booking,type,status,scheduled,created) VALUES(?,?,?,'pending',?,?)")
    .bind(item.id, item.booking, item.type, item.scheduled, item.created));
  return {
    async getConfig() {
      const row = await db.prepare("SELECT value FROM settings WHERE key='config'").first();
      return row ? JSON.parse(row.value) : null;
    },
    saveConfig(config) {
      return db.prepare("INSERT INTO settings(key,value) VALUES('config',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(JSON.stringify(config)).run();
    },
    findBooking(id) { return db.prepare('SELECT * FROM bookings WHERE id=?').bind(id).first(); },
    async occupied(date, exclude) {
      const result = exclude
        ? await db.prepare('SELECT minute FROM occupancy WHERE date=? AND booking<>?').bind(date, exclude).all()
        : await db.prepare('SELECT minute FROM occupancy WHERE date=?').bind(date).all();
      return result.results.map(row => row.minute);
    },
    async listAgenda(date, end) {
      const result = await db.prepare('SELECT id,name,phone,service,price,duration,date,start,status,kind FROM bookings WHERE date>=? AND date<=? ORDER BY date,start').bind(date, end).all();
      return result.results;
    },
    createBooking(booking, minutes, queuedMessages) {
      const b = booking;
      const statements = [db.prepare('INSERT INTO bookings(id,token,name,phone,service,price,duration,date,start,status,kind,created) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
        .bind(b.id, b.token, b.name, b.phone, b.service, b.price, b.duration, b.date, b.start, b.status, b.kind, b.created), ...occupancy(b.id, b.date, minutes)];
      statements.push(...messages(queuedMessages));
      return db.batch(statements);
    },
    moveBooking(id, date, start, minutes, queuedMessages) {
      return db.batch([
        db.prepare('DELETE FROM occupancy WHERE booking=?').bind(id),
        db.prepare("UPDATE bookings SET date=?,start=? WHERE id=? AND status='confirmed'").bind(date, start, id),
        ...occupancy(id, date, minutes), cancelMessages(id),
        ...messages(queuedMessages),
      ]);
    },
    cancelBooking(booking, queuedMessages) {
      return db.batch([
        db.prepare('DELETE FROM occupancy WHERE booking=?').bind(booking.id),
        db.prepare("UPDATE bookings SET status='cancelled' WHERE id=?").bind(booking.id), cancelMessages(booking.id),
        ...messages(queuedMessages),
      ]);
    },
  };
}
