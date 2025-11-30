-- Migration 016: Add Initial Cognitive Test Tracking for EBARS
-- Date: 2025-01-XX
-- Description: Add tracking for initial cognitive test completion
-- Dependency: Migration 015 (EBARS tables)

-- ===========================================
-- 1. Add initial test tracking to student_comprehension_scores
-- ===========================================

-- Add column to track if initial test has been completed
ALTER TABLE student_comprehension_scores 
ADD COLUMN has_completed_initial_test BOOLEAN DEFAULT 0;

-- Add column to store initial test score (0-100)
ALTER TABLE student_comprehension_scores 
ADD COLUMN initial_test_score DECIMAL(5,2) DEFAULT NULL;

-- Add column to store when initial test was completed
ALTER TABLE student_comprehension_scores 
ADD COLUMN initial_test_completed_at TIMESTAMP DEFAULT NULL;

-- ===========================================
-- 2. Create initial_cognitive_tests table
-- ===========================================
-- This table stores the initial cognitive test questions and answers
-- for each student-session pair

CREATE TABLE IF NOT EXISTS initial_cognitive_tests (
    test_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    
    -- Test questions (JSON array)
    questions TEXT NOT NULL,
    -- Format: [{"question": "...", "answer": "...", "correct": true/false, "score": 0-10}]
    
    -- Test results
    total_questions INTEGER NOT NULL DEFAULT 5,  -- Changed from 10 to 5
    correct_answers INTEGER NOT NULL DEFAULT 0,
    total_score DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    -- Score is calculated as (correct_answers / total_questions) * 100
    
    -- Test attempt tracking (for retry mechanism)
    test_attempt INTEGER NOT NULL DEFAULT 1,
    -- Stores answer preferences (JSON) for new 2-stage system
    answer_preferences TEXT,
    
    -- Timestamps
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Foreign key relationship
    UNIQUE(user_id, session_id),
    FOREIGN KEY (user_id, session_id) REFERENCES student_comprehension_scores(user_id, session_id) ON DELETE CASCADE
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_initial_tests_user_session 
ON initial_cognitive_tests(user_id, session_id);

CREATE INDEX IF NOT EXISTS idx_initial_tests_completed_at 
ON initial_cognitive_tests(completed_at DESC);

-- ===========================================
-- Migration complete
-- ===========================================

SELECT 'Migration 016 complete - Initial test tracking ready' AS status;

