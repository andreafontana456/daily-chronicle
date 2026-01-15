import { Flame, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDailyProgress } from '@/hooks/useDailyProgress';
import { cn } from '@/lib/utils';

interface DailyEventBadgeProps {
  compact?: boolean;
  className?: string;
}

export function DailyEventBadge({ compact = false, className }: DailyEventBadgeProps) {
  const { progress, streak, needsPost, needsVotes, votesRemaining } = useDailyProgress();

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <AnimatePresence mode="wait">
          {progress.completed ? (
            <motion.div
              key="completed"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-1"
            >
              <Check className="h-4 w-4 text-success" />
              <span className="text-xs font-medium text-success">Completato!</span>
            </motion.div>
          ) : (
            <motion.div
              key="pending"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 rounded-full bg-warning/10 px-2 py-1"
            >
              <AlertCircle className="h-4 w-4 text-warning pulse-notification" />
              <span className="text-xs font-medium text-warning">Evento giornaliero</span>
            </motion.div>
          )}
        </AnimatePresence>

        {streak.currentStreak > 0 && (
          <div className="flex items-center gap-1 rounded-full bg-streak/10 px-2 py-1">
            <Flame className="h-4 w-4 text-streak streak-fire" />
            <span className="text-xs font-bold text-streak">{streak.currentStreak}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl p-4 glass border border-border shadow-md',
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground">Evento Giornaliero</h3>
        {streak.currentStreak > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-gradient-streak px-3 py-1">
            <Flame className="h-4 w-4 text-white streak-fire" />
            <span className="text-sm font-bold text-white">{streak.currentStreak} giorni</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {/* Post status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Pubblica 1 contenuto</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {progress.postCount}/1
            </span>
            {!needsPost && (
              <Check className="h-4 w-4 text-success" />
            )}
          </div>
        </div>

        {/* Votes status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Vota 3 contenuti</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {Math.min(progress.voteCount, 3)}/3
            </span>
            {!needsVotes && (
              <Check className="h-4 w-4 text-success" />
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full bg-gradient-primary rounded-full"
            initial={{ width: 0 }}
            animate={{
              width: `${((progress.completed ? 4 : (needsPost ? 0 : 1) + Math.min(progress.voteCount, 3)) / 4) * 100}%`,
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Status message */}
        <AnimatePresence mode="wait">
          {progress.completed ? (
            <motion.p
              key="done"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-success font-medium text-center mt-2"
            >
              🎉 Evento completato! Ottimo lavoro!
            </motion.p>
          ) : (
            <motion.p
              key="pending"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-muted-foreground text-center mt-2"
            >
              {needsPost && needsVotes
                ? `Pubblica un contenuto e vota ${votesRemaining} post`
                : needsPost
                ? 'Pubblica un contenuto per completare!'
                : `Vota ancora ${votesRemaining} post`}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
