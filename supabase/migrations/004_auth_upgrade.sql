-- Add username and password columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Update existing users with a generated username and default password
UPDATE users 
SET 
  username = LOWER(REPLACE(REPLACE(name, ' ', ''), 'đ', 'd')) || '_' || floor(random() * 1000)::text,
  password = '123'
WHERE username IS NULL;

-- Make them NOT NULL after populating existing rows
ALTER TABLE users ALTER COLUMN username SET NOT NULL;
ALTER TABLE users ALTER COLUMN password SET NOT NULL;

-- Make username unique
ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);

-- Create a default admin account if not exists
INSERT INTO users (name, role, zone, username, password)
SELECT 'Quản trị viên', 'manager', 'Tổng', 'admin', 'admin123'
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE username = 'admin'
);

-- Ensure RLS allows the frontend to query/insert (if not already disabled)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Reload schema cache for postgrest
NOTIFY pgrst, 'reload schema';
