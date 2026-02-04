-- Ensure trigger to create profile on user signup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Secure, sanitized leaderboard function (bypasses RLS safely)
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_test_id uuid)
RETURNS TABLE (
  result_id uuid,
  user_id uuid,
  wpm numeric,
  accuracy numeric,
  time_taken integer,
  total_words integer,
  display_name text
) AS $$
  SELECT 
    tr.id AS result_id,
    tr.user_id,
    tr.wpm,
    tr.accuracy,
    tr.time_taken,
    COALESCE(tr.total_words, 0) AS total_words,
    COALESCE(NULLIF(p.full_name, ''), split_part(p.email, '@', 1), 'Anonymous') AS display_name
  FROM public.test_results tr
  LEFT JOIN public.profiles p ON p.id = tr.user_id
  WHERE tr.accuracy >= 85
    AND (tr.time_taken >= 600 OR COALESCE(tr.total_words, 0) >= 400)
    AND (p_test_id IS NULL OR tr.test_id = p_test_id)
  ORDER BY tr.wpm DESC, tr.accuracy DESC, tr.time_taken DESC
  LIMIT 100;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Storage policies for avatars bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Avatar images are publicly accessible'
  ) THEN
    CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'avatars');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Users can upload their own avatar'
  ) THEN
    CREATE POLICY "Users can upload their own avatar"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'avatars' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Users can update their own avatar'
  ) THEN
    CREATE POLICY "Users can update their own avatar"
    ON storage.objects
    FOR UPDATE
    USING (
      bucket_id = 'avatars' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;