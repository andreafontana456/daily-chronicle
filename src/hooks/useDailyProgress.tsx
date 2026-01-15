import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface DailyProgress {
  postCount: number;
  voteCount: number;
  completed: boolean;
}

interface Streak {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
}

export function useDailyProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<DailyProgress>({
    postCount: 0,
    voteCount: 0,
    completed: false,
  });
  const [streak, setStreak] = useState<Streak>({
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDate: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchProgress = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch daily progress
      const { data: progressData } = await supabase
        .from('daily_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (progressData) {
        setProgress({
          postCount: progressData.post_count,
          voteCount: progressData.vote_count,
          completed: progressData.completed,
        });
      }

      // Fetch streak
      const { data: streakData } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (streakData) {
        setStreak({
          currentStreak: streakData.current_streak,
          longestStreak: streakData.longest_streak,
          lastCompletedDate: streakData.last_completed_date,
        });
      }

      setLoading(false);
    };

    fetchProgress();

    // Subscribe to realtime updates
    const progressChannel = supabase
      .channel('daily-progress-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_progress',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'post_count' in payload.new) {
            const newData = payload.new as { post_count: number; vote_count: number; completed: boolean };
            setProgress({
              postCount: newData.post_count,
              voteCount: newData.vote_count,
              completed: newData.completed,
            });
          }
        }
      )
      .subscribe();

    const streakChannel = supabase
      .channel('streak-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'streaks',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'current_streak' in payload.new) {
            const newData = payload.new as { current_streak: number; longest_streak: number; last_completed_date: string | null };
            setStreak({
              currentStreak: newData.current_streak,
              longestStreak: newData.longest_streak,
              lastCompletedDate: newData.last_completed_date,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(progressChannel);
      supabase.removeChannel(streakChannel);
    };
  }, [user]);

  const needsPost = progress.postCount < 1;
  const needsVotes = progress.voteCount < 3;
  const votesRemaining = Math.max(0, 3 - progress.voteCount);

  return {
    progress,
    streak,
    loading,
    needsPost,
    needsVotes,
    votesRemaining,
  };
}
