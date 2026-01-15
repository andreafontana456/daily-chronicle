import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { MoreHorizontal, Trash2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { StarRating } from './StarRating';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PostCardProps {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  description?: string;
  imageUrl?: string;
  selfRating: number;
  type: 'story' | 'global';
  createdAt: string;
  averageRating?: number;
  userVote?: number;
  onVote?: (postId: string, stars: number) => void;
  onDelete?: (postId: string) => void;
}

export function PostCard({
  id,
  userId,
  username,
  avatarUrl,
  description,
  imageUrl,
  selfRating,
  type,
  createdAt,
  averageRating,
  userVote,
  onVote,
  onDelete,
}: PostCardProps) {
  const { user } = useAuth();
  const [currentVote, setCurrentVote] = useState(userVote || 0);
  const [isVoting, setIsVoting] = useState(false);

  const isOwner = user?.id === userId;
  const timeAgo = formatDistanceToNow(new Date(createdAt), { 
    addSuffix: true, 
    locale: it 
  });

  const handleVote = async (stars: number) => {
    if (isOwner || isVoting) return;

    setIsVoting(true);
    try {
      if (currentVote === 0) {
        // Insert new vote
        const { error } = await supabase.from('votes').insert({
          post_id: id,
          user_id: user!.id,
          stars,
        });

        if (error) throw error;
      } else {
        // Update existing vote
        const { error } = await supabase
          .from('votes')
          .update({ stars })
          .eq('post_id', id)
          .eq('user_id', user!.id);

        if (error) throw error;
      }

      setCurrentVote(stars);
      onVote?.(id, stars);
      toast.success(`Hai votato ${stars} stelle!`);
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Errore durante il voto');
    } finally {
      setIsVoting(false);
    }
  };

  const handleDelete = async () => {
    if (!isOwner) return;

    try {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) throw error;
      
      onDelete?.(id);
      toast.success('Post eliminato');
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Errore durante l\'eliminazione');
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-card rounded-xl border border-border overflow-hidden shadow-sm card-hover"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'rounded-full p-0.5',
            type === 'story' && 'story-ring'
          )}>
            <Avatar className="h-10 w-10 border-2 border-background">
              <AvatarImage src={avatarUrl} alt={username} />
              <AvatarFallback className="bg-gradient-primary text-white font-medium">
                {username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <div>
            <p className="font-semibold text-foreground">{username}</p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>{timeAgo}</span>
              {type === 'story' && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 text-accent">
                    <Clock className="h-3 w-3" />
                    Storia
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Elimina
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Image */}
      {imageUrl && (
        <div className="aspect-square w-full overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt="Post content"
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        {description && (
          <p className="text-foreground leading-relaxed">{description}</p>
        )}

        {/* Ratings section */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Auto-rating</span>
            <StarRating rating={selfRating} size="sm" />
          </div>

          {!isOwner && user && (
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-muted-foreground">
                {currentVote > 0 ? 'Il tuo voto' : 'Vota questo post'}
              </span>
              <StarRating
                rating={currentVote}
                size="md"
                interactive={!isVoting}
                onChange={handleVote}
              />
            </div>
          )}

          {averageRating !== undefined && averageRating > 0 && (
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-muted-foreground">Media voti</span>
              <div className="flex items-center gap-1">
                <StarRating rating={Math.round(averageRating)} size="sm" />
                <span className="text-sm font-medium text-foreground">
                  {averageRating.toFixed(1)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}
