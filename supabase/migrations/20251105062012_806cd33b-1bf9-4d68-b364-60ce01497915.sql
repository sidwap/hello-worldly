-- Add missing columns to test_results table for proper data storage
ALTER TABLE test_results ADD COLUMN IF NOT EXISTS gross_wpm numeric;
ALTER TABLE test_results ADD COLUMN IF NOT EXISTS total_words integer DEFAULT 0;
ALTER TABLE test_results ADD COLUMN IF NOT EXISTS typed_words integer DEFAULT 0;
ALTER TABLE test_results ADD COLUMN IF NOT EXISTS errors integer DEFAULT 0;
ALTER TABLE test_results ADD COLUMN IF NOT EXISTS total_keystrokes integer DEFAULT 0;

-- Rename columns to match the code
ALTER TABLE test_results RENAME COLUMN correct_chars TO correct_keystrokes;
ALTER TABLE test_results RENAME COLUMN wrong_chars TO wrong_keystrokes;
ALTER TABLE test_results RENAME COLUMN correct_words TO correct_words_count;
ALTER TABLE test_results RENAME COLUMN wrong_words TO incorrect_words;