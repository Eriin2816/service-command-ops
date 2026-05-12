-- Migration: add password_hash to users table
-- Allows NextAuth credentials provider to verify passwords via bcrypt
-- without depending on a third-party auth provider.
--
-- After applying this migration, run:
--   npx tsx scripts/seed.ts
-- to populate hashed passwords for the dev seed users.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash TEXT;
