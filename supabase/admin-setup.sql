-- Admin Setup Script
-- Run this in Supabase SQL editor to create initial admin users
-- Replace 'admin@example.com' with your actual admin email

-- Method 1: Update existing user to admin (if user already exists)
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'admin@example.com';

-- Method 2: Insert admin user directly (if you know the auth.users UUID)
-- INSERT INTO public.users (id, email, role)
-- VALUES ('your-auth-user-uuid-here', 'admin@example.com', 'admin');

-- Verify admin setup
SELECT id, email, role, created_at 
FROM public.users 
WHERE role = 'admin';

-- Test is_admin() function
SELECT public.is_admin(); -- Should return true when run as admin user
