-- Create site_notices table for managing announcement popups
CREATE TABLE public.site_notices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  link_url TEXT,
  link_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_notices ENABLE ROW LEVEL SECURITY;

-- Anyone can view notices (needed for public display)
CREATE POLICY "Anyone can view notices"
ON public.site_notices
FOR SELECT
USING (true);

-- Admins can manage notices
CREATE POLICY "Admins can insert notices"
ON public.site_notices
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update notices"
ON public.site_notices
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete notices"
ON public.site_notices
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_site_notices_updated_at
BEFORE UPDATE ON public.site_notices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert a default notice
INSERT INTO public.site_notices (title, content, is_enabled)
VALUES ('Welcome to TypeScribe Zen!', 'Start improving your typing skills today. Check out our new features and compete on the leaderboard!', false);