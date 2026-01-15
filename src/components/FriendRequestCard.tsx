import { Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FriendRequestCardProps {
  id: string;
  senderId: string;
  username: string;
  avatarUrl?: string;
  onResponse?: () => void;
}

export function FriendRequestCard({
  id,
  senderId,
  username,
  avatarUrl,
  onResponse,
}: FriendRequestCardProps) {
  const handleAccept = async () => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Ora sei amico di ${username}!`);
      onResponse?.();
    } catch (error) {
      console.error('Error accepting:', error);
      toast.error('Errore durante l\'accettazione');
    }
  };

  const handleReject = async () => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Richiesta rifiutata');
      onResponse?.();
    } catch (error) {
      console.error('Error rejecting:', error);
      toast.error('Errore durante il rifiuto');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex items-center justify-between p-3 rounded-xl bg-card border border-border"
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={avatarUrl} alt={username} />
          <AvatarFallback className="bg-gradient-primary text-white">
            {username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-foreground">{username}</p>
          <p className="text-sm text-muted-foreground">Vuole essere tuo amico</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="outline"
          className="h-9 w-9 text-destructive hover:text-destructive"
          onClick={handleReject}
        >
          <X className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          className="h-9 w-9 bg-success hover:bg-success/90"
          onClick={handleAccept}
        >
          <Check className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
