-- Add exam_type column to test_results table
ALTER TABLE public.test_results 
ADD COLUMN exam_type text DEFAULT 'all_exam';

-- Add skipped_words and extra_words columns for UP Police exam calculations
ALTER TABLE public.test_results 
ADD COLUMN skipped_words integer DEFAULT 0;

ALTER TABLE public.test_results 
ADD COLUMN extra_words integer DEFAULT 0;

-- Add gross_speed column for UP Police exam (words per minute based on total typed)
ALTER TABLE public.test_results 
ADD COLUMN gross_speed numeric;

-- Add net_speed column for UP Police exam (words per minute based on correct words)
ALTER TABLE public.test_results 
ADD COLUMN net_speed numeric;

-- Add backspace_count for tracking backspace usage
ALTER TABLE public.test_results 
ADD COLUMN backspace_count integer DEFAULT 0;

-- Add qualified status for UP Police exam
ALTER TABLE public.test_results 
ADD COLUMN is_qualified boolean DEFAULT false;