-- Migration: Add unique constraint to compatibility_scores table
-- This ensures only one compatibility score per relationship (for upsert functionality)
 
-- Add unique constraint on relationship_id
ALTER TABLE compatibility_scores 
ADD CONSTRAINT compatibility_scores_relationship_id_unique 
UNIQUE (relationship_id); 