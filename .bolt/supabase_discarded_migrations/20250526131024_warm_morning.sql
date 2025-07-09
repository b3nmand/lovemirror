/*
  # Fix Relationships Foreign Keys

  1. Changes:
    - Add proper foreign key constraints to relationships table
    - Create explicit indexes for better query performance
    - Ensure foreign key relationships are properly defined between tables
  
  2. Purpose:
    - Fix the error "Could not find a relationship between 'relationships' and 'user1_id'"
    - Ensure that Supabase can properly infer relationships between tables
    - Improve query performance with appropriate indexes
*/

-- First, make sure relationships table exists and has correct constraints
DO $$ 
BEGIN
  -- Recreate foreign key constraints with proper references
  ALTER TABLE relationships 
  DROP CONSTRAINT IF EXISTS relationships_user1_id_fkey;
  
  ALTER TABLE relationships 
  DROP CONSTRAINT IF EXISTS relationships_user2_id_fkey;
  
  -- Add proper foreign key constraints
  ALTER TABLE relationships
  ADD CONSTRAINT relationships_user1_id_fkey 
  FOREIGN KEY (user1_id) 
  REFERENCES auth.users(id);
  
  ALTER TABLE relationships
  ADD CONSTRAINT relationships_user2_id_fkey 
  FOREIGN KEY (user2_id) 
  REFERENCES auth.users(id);
  
  -- Ensure we have proper indexes on these columns
  CREATE INDEX IF NOT EXISTS relationships_user1_id_idx ON relationships(user1_id);
  CREATE INDEX IF NOT EXISTS relationships_user2_id_idx ON relationships(user2_id);
  CREATE INDEX IF NOT EXISTS relationships_status_idx ON relationships(status);
END $$;