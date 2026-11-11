PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS bookings (
 id TEXT PRIMARY KEY, token TEXT NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL,
 service TEXT NOT NULL, price INTEGER NOT NULL, duration INTEGER NOT NULL,
 date TEXT NOT NULL, start INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'confirmed',
 kind TEXT NOT NULL DEFAULT 'appointment', created TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS occupancy (
 date TEXT NOT NULL, minute INTEGER NOT NULL, booking TEXT NOT NULL REFERENCES bookings(id),
 PRIMARY KEY (date,minute)
);
CREATE TABLE IF NOT EXISTS outbox (
 id TEXT PRIMARY KEY, booking TEXT NOT NULL REFERENCES bookings(id), type TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending', scheduled TEXT NOT NULL, created TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS bookings_date ON bookings(date,start);
