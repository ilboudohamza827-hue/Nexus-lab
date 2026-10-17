import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter, Link } from '@/lib/router';
import { supabase } from '@/lib/supabase';
import type { Opportunity } from '@/lib/types';
import { OpportunityCard } from '@/components/OpportunityCard';
import { LoadingSpinner, EmptyState } from '@/components/UI';
import { Heart, ArrowRight } from 'lucide-react';

export function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const { navigate } = useRouter();
  const [favorites, setFavorites] = useState<Opportunity[]>([]);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('favorites')
      .select('opportunity_id, opportunity:opportunities(*, category:categories(*))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const opps = (data as unknown as { opportunity_id: string; opportunity: Opportunity }[])?.map((d) => d.opportunity) ?? [];
    setFavorites(opps);
    setFavIds(new Set(opps.map((o) => o.id)));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/connexion');
      return;
    }
    load();
  }, [authLoading, user, navigate, load]);

  function toggleFav(id: string) {
    setFavorites((prev) => prev.filter((o) => o.id !== id));
    setFavIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  if (authLoading || loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#080808] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Heart className="w-6 h-6 text-[#FFD400]" /> Mes favoris
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {favorites.length > 0 ? `${favorites.length} opportunité${favorites.length > 1 ? 's' : ''} enregistrée${favorites.length > 1 ? 's' : ''}` : 'Aucun favori pour le moment'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {favorites.length === 0 ? (
          <EmptyState
            title="Aucun favori"
            message="Sauvegarde les opportunités qui t'intéressent en cliquant sur le cœur sur chaque carte."
            actionLabel="Explorer le catalogue"
            onAction={() => navigate('/catalogue')}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {favorites.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                isFavorite={favIds.has(opp.id)}
                onFavoriteToggle={() => toggleFav(opp.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
