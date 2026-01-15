-- Create post_type enum
CREATE TYPE public.post_type AS ENUM ('story', 'global');

-- Create friendship_status enum
CREATE TYPE public.friendship_status AS ENUM ('pending', 'accepted');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create posts table
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type public.post_type NOT NULL DEFAULT 'global',
  description TEXT,
  image_url TEXT,
  self_rating INTEGER NOT NULL CHECK (self_rating >= 1 AND self_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create votes table
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create friendships table
CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.friendship_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id),
  CHECK (sender_id != receiver_id)
);

-- Create daily_progress table
CREATE TABLE public.daily_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  post_count INTEGER NOT NULL DEFAULT 0,
  vote_count INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create streaks table
CREATE TABLE public.streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_completed_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_posts_user_id_created_at ON public.posts(user_id, created_at DESC);
CREATE INDEX idx_posts_type_created_at ON public.posts(type, created_at DESC);
CREATE INDEX idx_friendships_sender_receiver ON public.friendships(sender_id, receiver_id);
CREATE INDEX idx_friendships_receiver_sender ON public.friendships(receiver_id, sender_id);
CREATE INDEX idx_votes_post_id ON public.votes(post_id);
CREATE INDEX idx_daily_progress_user_date ON public.daily_progress(user_id, date);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

-- Helper function to check if two users are friends
CREATE OR REPLACE FUNCTION public.is_friend(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.friendships
    WHERE status = 'accepted'
    AND (
      (sender_id = auth.uid() AND receiver_id = target_user_id)
      OR (sender_id = target_user_id AND receiver_id = auth.uid())
    )
  )
$$;

-- Helper function to check if a post is visible to current user
CREATE OR REPLACE FUNCTION public.can_view_post(post_row public.posts)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    post_row.type = 'global' 
    OR post_row.user_id = auth.uid()
    OR (
      post_row.type = 'story' 
      AND public.is_friend(post_row.user_id)
      AND post_row.created_at > now() - interval '24 hours'
    )
$$;

-- Profiles policies
CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- Posts policies
CREATE POLICY "Users can view permitted posts"
  ON public.posts FOR SELECT
  USING (
    type = 'global' 
    OR user_id = auth.uid()
    OR (
      type = 'story' 
      AND public.is_friend(user_id)
      AND created_at > now() - interval '24 hours'
    )
  );

CREATE POLICY "Users can create own posts"
  ON public.posts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own posts"
  ON public.posts FOR DELETE
  USING (user_id = auth.uid());

-- Votes policies
CREATE POLICY "Anyone can view votes"
  ON public.votes FOR SELECT
  USING (true);

CREATE POLICY "Users can create votes on others posts"
  ON public.votes FOR INSERT
  WITH CHECK (
    user_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM public.posts 
      WHERE id = post_id 
      AND user_id != auth.uid()
    )
  );

CREATE POLICY "Users can update own votes"
  ON public.votes FOR UPDATE
  USING (user_id = auth.uid());

-- Friendships policies
CREATE POLICY "Users can view own friendships"
  ON public.friendships FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send friend requests"
  ON public.friendships FOR INSERT
  WITH CHECK (sender_id = auth.uid() AND sender_id != receiver_id);

CREATE POLICY "Receivers can update friendship status"
  ON public.friendships FOR UPDATE
  USING (receiver_id = auth.uid());

CREATE POLICY "Users can delete own friendships"
  ON public.friendships FOR DELETE
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Daily progress policies
CREATE POLICY "Users can view own daily progress"
  ON public.daily_progress FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own daily progress"
  ON public.daily_progress FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own daily progress"
  ON public.daily_progress FOR UPDATE
  USING (user_id = auth.uid());

-- Streaks policies
CREATE POLICY "Users can view own streaks"
  ON public.streaks FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own streaks"
  ON public.streaks FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own streaks"
  ON public.streaks FOR UPDATE
  USING (user_id = auth.uid());

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'username', NEW.email));
  
  INSERT INTO public.streaks (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update daily progress when a post is created
CREATE OR REPLACE FUNCTION public.increment_post_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.daily_progress (user_id, date, post_count, vote_count)
  VALUES (NEW.user_id, CURRENT_DATE, 1, 0)
  ON CONFLICT (user_id, date)
  DO UPDATE SET post_count = daily_progress.post_count + 1;
  
  -- Check if daily event is completed
  UPDATE public.daily_progress
  SET completed = (post_count >= 1 AND vote_count >= 3)
  WHERE user_id = NEW.user_id AND date = CURRENT_DATE;
  
  RETURN NEW;
END;
$$;

-- Trigger for post creation
CREATE TRIGGER on_post_created
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.increment_post_count();

-- Function to update daily progress when a vote is created
CREATE OR REPLACE FUNCTION public.increment_vote_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.daily_progress (user_id, date, post_count, vote_count)
  VALUES (NEW.user_id, CURRENT_DATE, 0, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET vote_count = daily_progress.vote_count + 1;
  
  -- Check if daily event is completed
  UPDATE public.daily_progress
  SET completed = (post_count >= 1 AND vote_count >= 3)
  WHERE user_id = NEW.user_id AND date = CURRENT_DATE;
  
  RETURN NEW;
END;
$$;

-- Trigger for vote creation
CREATE TRIGGER on_vote_created
  AFTER INSERT ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.increment_vote_count();

-- Function to update streaks when daily progress is completed
CREATE OR REPLACE FUNCTION public.update_streak_on_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
    UPDATE public.streaks
    SET 
      current_streak = CASE
        WHEN last_completed_date = CURRENT_DATE - 1 THEN current_streak + 1
        WHEN last_completed_date = CURRENT_DATE THEN current_streak
        ELSE 1
      END,
      longest_streak = GREATEST(
        longest_streak,
        CASE
          WHEN last_completed_date = CURRENT_DATE - 1 THEN current_streak + 1
          WHEN last_completed_date = CURRENT_DATE THEN current_streak
          ELSE 1
        END
      ),
      last_completed_date = CURRENT_DATE,
      updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for streak update
CREATE TRIGGER on_daily_progress_completed
  AFTER UPDATE ON public.daily_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_streak_on_completion();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_streaks_updated_at
  BEFORE UPDATE ON public.streaks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for post images
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true);

-- Storage policies for post images
CREATE POLICY "Anyone can view post images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );