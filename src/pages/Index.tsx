import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Filter } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { PostCard } from '@/components/PostCard';
import { DailyEventBadge } from '@/components/DailyEventBadge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Post {
  id: string;
  user_id: string;
  description: string | null;
  image_url: string | null;
  self_rating: number;
  type: 'story' | 'global';
  created_at: string;
  profiles: { username: string; avatar_url: string | null };
  userVote?: number;
  averageRating?: number;
}

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<'all' | 'global' | 'stories'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchPosts();
  }, [user, filter]);

  const fetchPosts = async () => {
    if (!user) return;
    setIsLoading(true);

    let query = supabase
      .from('posts')
      .select('*, profiles(username, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (filter === 'global') {
      query = query.eq('type', 'global');
    } else if (filter === 'stories') {
      query = query.eq('type', 'story');
    }

    const { data, error } = await query;

    if (!error && data) {
      // Fetch user votes
      const { data: votes } = await supabase
        .from('votes')
        .select('post_id, stars')
        .eq('user_id', user.id);

      const votesMap = new Map(votes?.map(v => [v.post_id, v.stars]) || []);

      setPosts(data.map(post => ({
        ...post,
        type: post.type as 'story' | 'global',
        userVote: votesMap.get(post.id),
      })));
    }
    setIsLoading(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Caricamento...</div>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <DailyEventBadge />

        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">Tutti</TabsTrigger>
            <TabsTrigger value="global" className="flex-1">Globali</TabsTrigger>
            <TabsTrigger value="stories" className="flex-1">Storie</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                id={post.id}
                userId={post.user_id}
                username={post.profiles?.username || 'Utente'}
                avatarUrl={post.profiles?.avatar_url || undefined}
                description={post.description || undefined}
                imageUrl={post.image_url || undefined}
                selfRating={post.self_rating}
                type={post.type}
                createdAt={post.created_at}
                userVote={post.userVote}
                onVote={() => fetchPosts()}
                onDelete={() => fetchPosts()}
              />
            ))}
          </AnimatePresence>

          {!isLoading && posts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nessun post ancora.</p>
              <Button onClick={() => navigate('/create')} className="mt-4 bg-gradient-primary">
                Crea il primo post!
              </Button>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
