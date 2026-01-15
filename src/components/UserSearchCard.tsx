import { useState } from 'react';
import { UserPlus, Check, Clock, UserX } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted';

interface UserSearchCardProps {
  id: string;
  username: string;
  avatarUrl?: string;
  friendshipStatus: FriendshipStatus;
  onStatusChange?: () => void;
}

export function UserSearchCard({
  id,
  username,
  avatarUrl,
  friendshipStatus,
  onStatusChange,
}: UserSearchCardProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState(friendshipStatus);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendRequest = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { error } = await supabase.from('friendships').insert({
        sender_id: user.id,
        receiver_id: id,
      });

      if (error) throw error;
      setStatus('pending_sent');
      toast.success(`Richiesta inviata a ${username}`);
      onStatusChange?.();
    } catch (error) {
      console.error('Error sending request:', error);
      toast.error('Errore durante l\'invio');
    } finally {
      setIsLoading(false);
    }
  };

  const renderButton = () => {
    switch (status) {
      case 'accepted':
        return (
          <Button variant="secondary" size="sm" disabled className="gap-1.5">
            <Check className="h-4 w-4" />
            Amici
          </Button>
        );
      case 'pending_sent':
        return (
          <Button variant="outline" size="sm" disabled className="gap-1.5">
            <Clock className="h-4 w-4" />
            In attesa
          </Button>
        );
      case 'pending_received':
        return (
          <Button variant="secondary" size="sm" disabled className="gap-1.5">
            <UserX className="h-4 w-4" />
            Rispondere
          </Button>
        );
      default:
        return (
          <Button
            size="sm"
            onClick={handleSendRequest}
            disabled={isLoading}
            className="gap-1.5 bg-gradient-primary hover:opacity-90"
          >
            <UserPlus className="h-4 w-4" />
            Aggiungi
          </Button>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-3 rounded-xl bg-card border border-border"
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={avatarUrl} alt={username} />
          <AvatarFallback className="bg-gradient-primary text-white">
            {username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <p className="font-semibold text-foreground">{username}</p>
      </div>

      {renderButton()}
    </motion.div>
  );
}
