-- Prevent multiple admin accounts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM admin_users LIMIT 1
  ) THEN
    RAISE NOTICE 'No admins yet — signup allowed';
  ELSE
    RAISE NOTICE 'Admin already exists — signup must be blocked in backend';
  END IF;
END $$;
