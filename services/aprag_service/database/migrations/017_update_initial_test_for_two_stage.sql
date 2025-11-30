-- Migration 017: Update Initial Test for Two-Stage System
-- Date: 2025-01-XX
-- Description: Add support for 2-stage test system (5 questions + answer preference)
-- Dependency: Migration 016 (Initial test tracking)

-- ===========================================
-- 1. Add test_attempt column to initial_cognitive_tests
-- ===========================================

-- Add column to track test attempt number (for retry mechanism)
ALTER TABLE initial_cognitive_tests 
ADD COLUMN test_attempt INTEGER DEFAULT 1;

-- Add column to store answer preferences (JSON)
ALTER TABLE initial_cognitive_tests 
ADD COLUMN answer_preferences TEXT;

-- ===========================================
-- 2. Update default total_questions from 10 to 5
-- ===========================================

-- Note: This is informational - actual default is set in CREATE TABLE
-- Existing records will keep their values, new records will use 5

-- ===========================================
-- Migration complete
-- ===========================================

SELECT 'Migration 017 complete - Two-stage test system ready' AS status;

