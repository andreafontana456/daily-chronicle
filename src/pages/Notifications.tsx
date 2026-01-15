import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { DailyEventBadge } from '@/components/DailyEventBadge';
import { useAuth } from '@/hooks/useAuth';

export default function Notifications() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="Notifiche" showDailyBadge={false} />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <DailyEventBadge />
        <p className="text-center text-muted-foreground py-8">
          Le notifiche appariranno qui
        </p>
      </main>

      <BottomNav />
    </div>
  );
}
