-- Allow authenticated users to insert tests from Daily New Tests API
CREATE POLICY "Users can insert daily new tests"
ON public.typing_tests
FOR INSERT
TO authenticated
WITH CHECK (category = 'Daily New Tests');