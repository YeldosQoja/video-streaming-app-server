ALTER TABLE users DROP COLUMN password;
ALTER TABLE users ADD COLUMN password bytea;
ALTER TABLE users DROP COLUMN salt;
ALTER TABLE users ADD COLUMN salt bytea;