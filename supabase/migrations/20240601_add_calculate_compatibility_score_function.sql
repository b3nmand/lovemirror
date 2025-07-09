-- Migration: Add calculate_compatibility_score Postgres function
-- This function calculates compatibility scores between two users in a relationship

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS calculate_compatibility_score(uuid);

CREATE OR REPLACE FUNCTION calculate_compatibility_score(rel_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  relationship_record RECORD;
  user1_assessment RECORD;
  user2_assessment RECORD;
  category_compatibility jsonb := '[]'::jsonb;
  overall_compatibility numeric := 0;
  compatibility_score_record RECORD;
  cat TEXT;
  user1_raw numeric;
  user2_raw numeric;
  user1_max numeric := 50;
  user2_max numeric := 50;
  norm1 numeric;
  norm2 numeric;
  match_pct numeric;
  cat_json jsonb;
  cat_names TEXT[];
BEGIN
  -- Get relationship details
  SELECT user1_id, user2_id INTO relationship_record
  FROM relationships
  WHERE id = rel_id AND status = 'active';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Relationship not found or inactive';
  END IF;
  
  -- Get latest assessment for user1
  SELECT * INTO user1_assessment
  FROM assessment_history
  WHERE user_id = relationship_record.user1_id
  ORDER BY completed_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User 1 has no completed assessments';
  END IF;
  
  -- Get latest assessment for user2
  SELECT * INTO user2_assessment
  FROM assessment_history
  WHERE user_id = relationship_record.user2_id
  ORDER BY completed_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User 2 has no completed assessments';
  END IF;
  
  -- Get all unique categories
  cat_names := ARRAY(
    SELECT DISTINCT (value->>'category')::text
    FROM jsonb_array_elements(user1_assessment.category_scores)
    UNION
    SELECT DISTINCT (value->>'category')::text
    FROM jsonb_array_elements(user2_assessment.category_scores)
  );
  
  -- For each category, calculate normalized scores and match percentage
  FOREACH cat IN ARRAY cat_names LOOP
    -- Get user1 raw
    SELECT (value->>'score')::numeric INTO user1_raw
    FROM jsonb_array_elements(user1_assessment.category_scores)
    WHERE (value->>'category')::text = cat
    LIMIT 1;
    
    -- Get user2 raw
    SELECT (value->>'score')::numeric INTO user2_raw
    FROM jsonb_array_elements(user2_assessment.category_scores)
    WHERE (value->>'category')::text = cat
    LIMIT 1;
    
    -- If either is missing, skip this category
    IF user1_raw IS NULL OR user2_raw IS NULL THEN
      CONTINUE;
    END IF;
    
    -- Normalize (max is always 50 for all types/categories)
    norm1 := user1_raw / user1_max;
    norm2 := user2_raw / user2_max;
    
    -- Calculate match percentage
    match_pct := (1 - abs(norm1 - norm2)) * 100;
    
    -- Build JSON for this category
    cat_json := jsonb_build_object(
      'category', cat,
      'user1_score', user1_raw,
      'user2_score', user2_raw,
      'normalized_user1', norm1,
      'normalized_user2', norm2,
      'match_percentage', match_pct
    );
    
    category_compatibility := category_compatibility || cat_json;
  END LOOP;
  
  -- Calculate overall compatibility
  SELECT AVG((value->>'match_percentage')::numeric)
  INTO overall_compatibility
  FROM jsonb_array_elements(category_compatibility);
  
  -- Insert or update compatibility score
  INSERT INTO compatibility_scores (
    relationship_id,
    category_scores,
    overall_score,
    overall_percentage,
    analysis_date
  ) VALUES (
    rel_id,
    category_compatibility,
    overall_compatibility,
    overall_compatibility,
    NOW()
  )
  ON CONFLICT (relationship_id) DO UPDATE SET
    category_scores = EXCLUDED.category_scores,
    overall_score = EXCLUDED.overall_score,
    overall_percentage = EXCLUDED.overall_percentage,
    analysis_date = EXCLUDED.analysis_date
  RETURNING * INTO compatibility_score_record;
  
  -- Return the created/updated compatibility score
  RETURN jsonb_build_object(
    'id', compatibility_score_record.id,
    'relationship_id', compatibility_score_record.relationship_id,
    'category_scores', compatibility_score_record.category_scores,
    'overall_score', compatibility_score_record.overall_score,
    'overall_percentage', compatibility_score_record.overall_percentage,
    'analysis_date', compatibility_score_record.analysis_date,
    'created_at', compatibility_score_record.created_at
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION calculate_compatibility_score(uuid) TO authenticated; 