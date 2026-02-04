-- Add typed_text column to store the actual text typed by user for paragraph comparison
ALTER TABLE public.test_results ADD COLUMN IF NOT EXISTS typed_text TEXT;