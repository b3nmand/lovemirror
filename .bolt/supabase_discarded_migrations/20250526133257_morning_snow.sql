-- This migration creates a users table with explicit RLS policies
-- It also handles backfilling the table with existing users from auth.users

-- Create users table if it doesn't exist already
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users,
  email text,
  name text
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Ensure users table has the proper RLS policies
DO $$ 
BEGIN
  -- Drop any existing policies first to avoid conflicts
  DROP POLICY IF EXISTS "Users can read their own data" ON public.users;
  DROP POLICY IF EXISTS "Users can update own data" ON public.users;
  DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
  DROP POLICY IF EXISTS "Admins can read all user data" ON public.users;
  
  -- Create policies with proper permissions
  CREATE POLICY "Users can read their own data"
    ON public.users
    FOR SELECT
    TO public
    USING (auth.uid() = id);
  
  CREATE POLICY "Users can update own data"
    ON public.users
    FOR UPDATE
    TO public
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
  
  CREATE POLICY "Enable read access for authenticated users"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (true);
  
  CREATE POLICY "Admins can read all user data"
    ON public.users
    FOR SELECT
    TO authenticated
    USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);
END $$;

-- Create a function to sync users from auth.users to public.users
CREATE OR REPLACE FUNCTION sync_users_from_auth() 
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Insert or update the public users table
    INSERT INTO public.users (id, email, name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name')
    ON CONFLICT (id) DO UPDATE 
    SET 
      email = NEW.email,
      name = COALESCE(NEW.raw_user_meta_data->>'name', public.users.name);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Delete from the public users table
    DELETE FROM public.users WHERE id = OLD.id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'sync_users_from_auth_trigger'
  ) THEN
    -- Create the trigger to keep users in sync
    CREATE TRIGGER sync_users_from_auth_trigger
    AFTER INSERT OR UPDATE OR DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_users_from_auth();
  END IF;
END
$$;

-- Now run a manual sync to ensure the users table is populated
-- First check if we have access to auth.users
DO $$
DECLARE
  has_access BOOLEAN;
BEGIN
  BEGIN
    -- Try to select from auth.users to see if we have access
    EXECUTE 'SELECT EXISTS(SELECT 1 FROM auth.users LIMIT 1)' INTO has_access;
    
    IF has_access THEN
      -- If we have access, perform the sync
      INSERT INTO public.users (id, email, name)
      SELECT id, email, raw_user_meta_data->>'name'
      FROM auth.users
      ON CONFLICT (id) DO UPDATE 
      SET 
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, public.users.name);
      
      RAISE NOTICE 'Successfully synced users from auth.users to public.users';
    END IF;
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Unable to sync existing users due to permissions. This is expected in RLS environment.';
  END;
END $$;