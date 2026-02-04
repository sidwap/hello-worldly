-- Create exams table for managing different exam types with their settings
CREATE TABLE public.exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  interface_theme TEXT DEFAULT 'default',
  default_time_limit INTEGER DEFAULT 900,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  -- Qualification criteria
  min_accuracy NUMERIC DEFAULT 85,
  min_speed_english INTEGER DEFAULT 30,
  min_speed_hindi INTEGER DEFAULT 25,
  min_time_required INTEGER DEFAULT 600,
  min_words_required INTEGER DEFAULT 400,
  use_keystroke_speed BOOLEAN DEFAULT false,
  -- Feature flags
  show_backspace_count BOOLEAN DEFAULT false,
  show_gross_net_speed BOOLEAN DEFAULT true,
  show_keystroke_speed BOOLEAN DEFAULT true,
  enable_sound BOOLEAN DEFAULT false,
  enable_font_size_control BOOLEAN DEFAULT false,
  enable_word_limit BOOLEAN DEFAULT true,
  default_word_limit_english INTEGER DEFAULT 500,
  default_word_limit_hindi INTEGER DEFAULT 400,
  -- Results display config
  show_skipped_words BOOLEAN DEFAULT false,
  show_extra_words BOOLEAN DEFAULT false,
  show_qualification_status BOOLEAN DEFAULT true,
  show_comparison_paragraph BOOLEAN DEFAULT true,
  show_error_rules BOOLEAN DEFAULT false,
  show_accuracy_formula BOOLEAN DEFAULT false,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- Create policies for exams
CREATE POLICY "Exams are viewable by everyone" 
ON public.exams 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert exams" 
ON public.exams 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update exams" 
ON public.exams 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete exams" 
ON public.exams 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_exams_updated_at
BEFORE UPDATE ON public.exams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default exams
INSERT INTO public.exams (slug, name, display_name, short_name, description, interface_theme, is_featured, sort_order,
  min_accuracy, min_speed_english, min_speed_hindi, show_backspace_count, enable_sound, enable_font_size_control,
  show_skipped_words, show_extra_words, show_error_rules, show_accuracy_formula)
VALUES 
  ('all_exam', 'all_exam', 'Standard Typing Test', 'Standard', 'General typing practice with basic metrics', 'default', true, 1,
   85, 30, 25, false, false, false, false, false, false, false),
  ('up_police', 'up_police', 'UP Police SI/ASI Typing Test', 'UP Police', 'Official UP Police Computer Operator typing test format', 'nta_style', true, 2,
   85, 30, 25, true, true, true, true, true, true, true),
  ('ssc_cgl', 'ssc_cgl', 'SSC CGL Typing Test', 'SSC CGL', 'Staff Selection Commission Combined Graduate Level typing test', 'ssc_style', false, 3,
   85, 35, 30, true, true, true, true, true, true, true),
  ('rrb_ntpc', 'rrb_ntpc', 'RRB NTPC Typing Test', 'RRB NTPC', 'Railway Recruitment Board Non-Technical Popular Category typing test', 'default', false, 4,
   90, 30, 25, true, false, true, true, true, true, true);

-- Create storage bucket for exam thumbnails
INSERT INTO storage.buckets (id, name, public) VALUES ('exam-thumbnails', 'exam-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for exam thumbnails
CREATE POLICY "Exam thumbnails are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'exam-thumbnails');

CREATE POLICY "Admins can upload exam thumbnails" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'exam-thumbnails' AND
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update exam thumbnails" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'exam-thumbnails' AND
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete exam thumbnails" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'exam-thumbnails' AND
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);