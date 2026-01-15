import { Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { DailyEventBadge } from './DailyEventBadge';
import { useDailyProgress } from '@/hooks/useDailyProgress';

interface HeaderProps {
  title?: string;
  showDailyBadge?: boolean;
}

export function Header({ title = 'SaveShit', showDailyBadge = true }: HeaderProps) {
  const { streak } = useDailyProgress();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl font-bold text-gradient"
        >
          {title}
        </motion.h1>

        <div className="flex items-center gap-3">
          {showDailyBadge && <DailyEventBadge compact />}
          
          {streak.currentStreak > 0 && !showDailyBadge && (
            <div className="flex items-center gap-1 rounded-full bg-streak/10 px-2.5 py-1">
              <Flame className="h-4 w-4 text-streak streak-fire" />
              <span className="text-sm font-bold text-streak">{streak.currentStreak}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
