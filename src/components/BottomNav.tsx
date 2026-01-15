import { Home, PlusSquare, Users, User, Bell } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useDailyProgress } from '@/hooks/useDailyProgress';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Users, label: 'Amici', path: '/friends' },
  { icon: PlusSquare, label: 'Crea', path: '/create', isMain: true },
  { icon: Bell, label: 'Notifiche', path: '/notifications' },
  { icon: User, label: 'Profilo', path: '/profile' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { progress, needsPost, needsVotes } = useDailyProgress();

  const showNotificationBadge = !progress.completed && (needsPost || needsVotes);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg safe-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          const showBadge = item.path === '/create' && showNotificationBadge;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'relative flex flex-col items-center py-3 px-4 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {item.isMain ? (
                <div className="relative">
                  <div className="rounded-xl bg-gradient-primary p-2.5">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  {showBadge && (
                    <span className="absolute -right-1 -top-1 flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-warning" />
                    </span>
                  )}
                </div>
              ) : (
                <>
                  <Icon className="h-6 w-6" />
                  {isActive && (
                    <motion.div
                      layoutId="navIndicator"
                      className="absolute -bottom-0 h-0.5 w-6 rounded-full bg-primary"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </>
              )}
              <span className={cn(
                'mt-1 text-[10px] font-medium',
                item.isMain && 'sr-only'
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
