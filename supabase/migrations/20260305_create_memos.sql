-- Create memos table
CREATE TABLE IF NOT EXISTS public.memos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  target_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.memos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own memos"
  ON public.memos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own memos"
  ON public.memos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memos"
  ON public.memos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memos"
  ON public.memos FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster date queries
CREATE INDEX idx_memos_target_date ON public.memos(target_date);
CREATE INDEX idx_memos_user_id ON public.memos(user_id);
