import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Flame, Star, FileText } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useDailyProgress } from '@/hooks/useDailyProgress';
import { supabase } from '@/integrations/supabase/client';

export default function Profile() {
  const { user, loading, signOut } = useAuth();
  const { streak } = useDailyProgress();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ posts: 0, votes: 0 });

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
    setProfile(data);
  };

  const fetchStats = async () => {
    const { count: posts } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', user!.id);
    const { count: votes } = await supabase.from('votes').select('*', { count: 'exact', head: true }).eq('user_id', user!.id);
    setStats({ posts: posts || 0, votes: votes || 0 });
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  if (!user || !profile) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="Profilo" showDailyBadge={false} />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback className="bg-gradient-primary text-white text-2xl">
              {profile.username?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold">{profile.username}</h2>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card rounded-xl p-4 text-center border">
            <FileText className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{stats.posts}</p>
            <p className="text-xs text-muted-foreground">Post</p>
          </div>
          <div className="bg-card rounded-xl p-4 text-center border">
            <Star className="h-5 w-5 mx-auto text-streak mb-1" />
            <p className="text-2xl font-bold">{stats.votes}</p>
            <p className="text-xs text-muted-foreground">Voti dati</p>
          </div>
          <div className="bg-card rounded-xl p-4 text-center border">
            <Flame className="h-5 w-5 mx-auto text-streak streak-fire mb-1" />
            <p className="text-2xl font-bold">{streak.currentStreak}</p>
            <p className="text-xs text-muted-foreground">Streak</p>
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Esci
        </Button>
      </main>

      <BottomNav />
    </div>
  );
}
