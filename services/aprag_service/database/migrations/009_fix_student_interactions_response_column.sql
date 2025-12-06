-- Fix student_interactions response column standardization
-- Migration 009: Ensure single 'response' column is used consistently

-- First, check if we need to migrate data from original_response/personalized_response to response
-- This is a safe operation that preserves existing data

BEGIN TRANSACTION;

-- Update empty response fields with data from other response columns (if they exist)
-- Priority: personalized_response > original_response > existing response
UPDATE student_interactions 
SET response = COALESCE(
    CASE WHEN response IS NOT NULL AND response != '' AND response != 'Processing...' THEN response END,
    personalized_response,
    original_response,
    response,
    'No response recorded'
)
WHERE response IS NULL OR response = '' OR response = 'Processing...';

-- For production safety, we won't drop the other columns immediately
-- Instead, we ensure response column is always populated
-- The application code should use only 'response' column going forward

-- Add index for better performance on response queries
CREATE INDEX IF NOT EXISTS idx_student_interactions_response_nonempty 
ON student_interactions(interaction_id) WHERE response IS NOT NULL AND response != '';

-- Add a check to ensure response is never null in new records
-- (SQLite doesn't support adding NOT NULL constraint to existing column, so we use a trigger)
CREATE TRIGGER IF NOT EXISTS ensure_student_interactions_response_not_null
BEFORE INSERT ON student_interactions
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN NEW.response IS NULL OR NEW.response = '' THEN
            RAISE(ABORT, 'response column cannot be null or empty')
    END;
END;

COMMIT;