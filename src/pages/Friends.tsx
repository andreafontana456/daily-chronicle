import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserSearchCard } from '@/components/UserSearchCard';
import { FriendRequestCard } from '@/components/FriendRequestCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function Friends() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchRequests();
    }
  }, [user]);

  useEffect(() => {
    if (search.length >= 2) searchUsers();
    else setUsers([]);
  }, [search]);

  const searchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user!.id)
      .ilike('username', `%${search}%`)
      .limit(10);
    setUsers(data || []);
  };

  const fetchFriends = async () => {
    const { data } = await supabase
      .from('friendships')
      .select('*, sender:profiles!friendships_sender_id_fkey(*), receiver:profiles!friendships_receiver_id_fkey(*)')
      .eq('status', 'accepted')
      .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`);
    setFriends(data || []);
  };

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('friendships')
      .select('*, sender:profiles!friendships_sender_id_fkey(*)')
      .eq('receiver_id', user!.id)
      .eq('status', 'pending');
    setRequests(data || []);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="Amici" showDailyBadge={false} />

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca utenti..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {search.length >= 2 ? (
          <div className="space-y-2">
            {users.map((u) => (
              <UserSearchCard
                key={u.id}
                id={u.id}
                username={u.username}
                avatarUrl={u.avatar_url}
                friendshipStatus="none"
              />
            ))}
          </div>
        ) : (
          <Tabs defaultValue="friends">
            <TabsList className="w-full">
              <TabsTrigger value="friends" className="flex-1">Amici ({friends.length})</TabsTrigger>
              <TabsTrigger value="requests" className="flex-1">Richieste ({requests.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="friends" className="space-y-2 mt-4">
              {friends.map((f) => {
                const friend = f.sender_id === user.id ? f.receiver : f.sender;
                return (
                  <UserSearchCard
                    key={f.id}
                    id={friend.id}
                    username={friend.username}
                    avatarUrl={friend.avatar_url}
                    friendshipStatus="accepted"
                  />
                );
              })}
              {friends.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Nessun amico ancora</p>
              )}
            </TabsContent>

            <TabsContent value="requests" className="space-y-2 mt-4">
              {requests.map((r) => (
                <FriendRequestCard
                  key={r.id}
                  id={r.id}
                  senderId={r.sender_id}
                  username={r.sender.username}
                  avatarUrl={r.sender.avatar_url}
                  onResponse={fetchRequests}
                />
              ))}
              {requests.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Nessuna richiesta</p>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
