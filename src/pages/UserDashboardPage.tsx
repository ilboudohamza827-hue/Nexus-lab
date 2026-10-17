import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter, Link } from '@/lib/router';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner, EmptyState, Badge } from '@/components/UI';
import { LayoutDashboard, Heart, Target, BookOpen, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { deadlineLabel, deadlineColor, isExpired } from '@/lib/utils';
import type { Opportunity } from '@/lib/types';

export function UserDashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { navigate } = useRouter();
  const [favCount, setFavCount] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [hasQuestionnaire, setHasQuestionnaire] = useState(false);
  const [recentOpps, setRecentOpps] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const [favRes, qaRes, oppRes] = await Promise.all([
      supabase.from('favorites').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('questionnaire_answers').select('is_complete').eq('user_id', user.id).maybeSingle(),
      supabase
        .from('opportunities')
        .select('*, category:categories(*)')
        .eq('status', 'publiee')
        .order('published_at', { ascending: false })
        .limit(5),
    ]);

    setFavCount(favRes.count ?? 0);
    setHasQuestionnaire(!!qaRes.data);

    const opps = (oppRes.data as unknown as Opportunity[]) ?? [];
    setRecentOpps(opps);
    setUpcomingCount(opps.filter((o) => !isExpired(o) && o.deadline).length);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/connexion');
      return;
    }
    load();
  }, [authLoading, user, navigate, load]);

  if (authLoading || loading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#080808] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-[#FFD400]" /> Tableau de bord
          </h1>
          <p className="text-gray-400 text-sm mt-1">Bienvenue, {profile?.display_name || user.email}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <Heart className="w-8 h-8 text-[#FFD400]" />
              <span className="text-2xl font-extrabold text-[#080808]">{favCount}</span>
            </div>
            <p className="text-sm text-gray-500">Favoris enregistrés</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-[#FFD400]" />
              <span className="text-2xl font-extrabold text-[#080808]">{upcomingCount}</span>
            </div>
            <p className="text-sm text-gray-500">Échéances à venir</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-[#FFD400]" />
              <span className="text-2xl font-extrabold text-[#080808]">{hasQuestionnaire ? '✓' : '—'}</span>
            </div>
            <p className="text-sm text-gray-500">Profil personnalisé</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link to="/pour-toi" className="bg-white rounded-xl border border-gray-200 p-4 nx-card flex items-center gap-3">
            <div className="w-10 h-10 bg-[#080808] rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#FFD400]" />
            </div>
            <div>
              <p className="font-semibold text-sm text-[#080808]">Pour toi</p>
              <p className="text-xs text-gray-400">Recommandations</p>
            </div>
          </Link>
          <Link to="/catalogue" className="bg-white rounded-xl border border-gray-200 p-4 nx-card flex items-center gap-3">
            <div className="w-10 h-10 bg-[#080808] rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[#FFD400]" />
            </div>
            <div>
              <p className="font-semibold text-sm text-[#080808]">Catalogue</p>
              <p className="text-xs text-gray-400">Explorer</p>
            </div>
          </Link>
          <Link to="/questionnaire" className="bg-white rounded-xl border border-gray-200 p-4 nx-card flex items-center gap-3">
            <div className="w-10 h-10 bg-[#080808] rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-[#FFD400]" />
            </div>
            <div>
              <p className="font-semibold text-sm text-[#080808]">Questionnaire</p>
              <p className="text-xs text-gray-400">{hasQuestionnaire ? 'Modifier' : 'Commencer'}</p>
            </div>
          </Link>
          <Link to="/favoris" className="bg-white rounded-xl border border-gray-200 p-4 nx-card flex items-center gap-3">
            <div className="w-10 h-10 bg-[#080808] rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-[#FFD400]" />
            </div>
            <div>
              <p className="font-semibold text-sm text-[#080808]">Favoris</p>
              <p className="text-xs text-gray-400">Mes sauvegardes</p>
            </div>
          </Link>
        </div>

        {/* Recent opportunities */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#080808]">Dernières opportunités</h2>
            <Link to="/catalogue" className="text-sm font-semibold text-[#080808] hover:text-[#FFD400] inline-flex items-center gap-1">
              Voir tout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {recentOpps.length === 0 ? (
            <EmptyState title="Aucune opportunité publiée" message="Les opportunités seront publiées prochainement." />
          ) : (
            <div className="space-y-2">
              {recentOpps.map((opp) => (
                <Link
                  key={opp.id}
                  to={`/opportunite/${opp.slug}`}
                  className="block bg-white rounded-xl border border-gray-200 p-4 nx-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {opp.category && <Badge variant="dark">{opp.category.name}</Badge>}
                        {isExpired(opp) && <Badge>Expirée</Badge>}
                      </div>
                      <h3 className="font-bold text-sm text-[#080808] line-clamp-1">{opp.title}</h3>
                      {opp.organization && <p className="text-xs text-gray-400 mt-0.5">{opp.organization}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xs font-semibold ${deadlineColor(opp)}`}>{deadlineLabel(opp)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
