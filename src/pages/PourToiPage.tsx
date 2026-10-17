import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter, Link } from '@/lib/router';
import { supabase } from '@/lib/supabase';
import type { Opportunity, QuestionnaireAnswers, StudyField, RecommendationResult, Video } from '@/lib/types';
import { OpportunityCard } from '@/components/OpportunityCard';
import { VideoCard } from '@/components/VideoCard';
import { LoadingSpinner, EmptyState, Badge } from '@/components/UI';
import { computeRecommendation, isExpired, daysUntilDeadline, deadlineLabel, deadlineColor } from '@/lib/utils';
import { Target, Clock, Sparkles, Heart, Video as VideoIcon, Compass, ArrowRight, TrendingUp } from 'lucide-react';

export function PourToiPage() {
  const { user, loading: authLoading } = useAuth();
  const { navigate } = useRouter();
  const [answers, setAnswers] = useState<QuestionnaireAnswers | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [studyFields, setStudyFields] = useState<StudyField[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [hasQuestionnaire, setHasQuestionnaire] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;

    const [qaRes, oppRes, fieldRes, vidRes, favRes] = await Promise.all([
      supabase.from('questionnaire_answers').select('*').eq('user_id', user.id).maybeSingle(),
      supabase
        .from('opportunities')
        .select('*, category:categories(*), study_fields:opportunity_study_fields(study_field:study_fields(*))')
        .eq('status', 'publiee')
        .order('published_at', { ascending: false }),
      supabase.from('study_fields').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('videos').select('*').eq('status', 'publiee').order('created_at', { ascending: false }).limit(4),
      supabase.from('favorites').select('opportunity_id').eq('user_id', user.id),
    ]);

    const qa = qaRes.data as { answers: QuestionnaireAnswers; is_complete: boolean } | null;
    if (qa?.answers) {
      setAnswers(qa.answers);
      setHasQuestionnaire(true);
    }

    const opps = (oppRes.data as unknown as Array<Record<string, unknown>>)?.map((d) => ({
      ...d,
      study_fields: ((d as unknown as { study_fields?: { study_field: StudyField }[] })?.study_fields)?.map((s) => s.study_field) ?? [],
    })) as Opportunity[] ?? [];
    setOpportunities(opps);
    setStudyFields(fieldRes.data as StudyField[] ?? []);
    setVideos(vidRes.data as Video[] ?? []);
    setFavorites(new Set((favRes.data ?? []).map((f: { opportunity_id: string }) => f.opportunity_id)));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/connexion');
      return;
    }
    loadData();
  }, [authLoading, user, navigate, loadData]);

  function toggleFav(id: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (authLoading || loading) return <LoadingSpinner message="Chargement de ton espace..." />;
  if (!user) return null;

  // No questionnaire yet
  if (!hasQuestionnaire || !answers) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-lg text-center py-12">
          <div className="w-16 h-16 bg-[#FFD400] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-[#080808]" />
          </div>
          <h1 className="text-2xl font-bold text-[#080808] mb-2">Personnalise ton espace</h1>
          <p className="text-gray-500 mb-6">
            Réponds au questionnaire pour recevoir des recommandations d'opportunités adaptées à ton profil,
            tes objectifs et tes intérêts.
          </p>
          <button
            onClick={() => navigate('/questionnaire')}
            className="px-6 py-3 bg-[#FFD400] text-[#080808] font-bold rounded-xl hover:bg-yellow-300 transition-colors inline-flex items-center gap-2"
          >
            Commencer le questionnaire <ArrowRight className="w-4 h-4" />
          </button>
          <div className="mt-4">
            <Link to="/catalogue" className="text-sm text-gray-400 hover:text-[#080808]">
              ou explore le catalogue →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Compute recommendations
  const allRecs = opportunities.map((opp) => computeRecommendation(opp, answers, studyFields));
  const confirmed = allRecs.filter((r) => r.matchType === 'confirmed' && !isExpired(r.opportunity)).sort((a, b) => b.score - a.score);
  const toVerify = allRecs.filter((r) => r.matchType === 'to_verify' && !isExpired(r.opportunity)).sort((a, b) => b.score - a.score);
  const recommended = [...confirmed, ...toVerify].slice(0, 6);

  // Upcoming deadlines
  const upcomingDeadlines = opportunities
    .filter((o) => !isExpired(o) && o.deadline)
    .sort((a, b) => (a.deadline! < b.deadline! ? -1 : 1))
    .slice(0, 4);

  // New matching opportunities
  const newMatches = recommended.filter((r) => {
    if (!r.opportunity.published_at) return false;
    const ageDays = (Date.now() - new Date(r.opportunity.published_at).getTime()) / (1000 * 60 * 60 * 24);
    return ageDays <= 30;
  });

  // Favorite opportunities
  const favOpps = opportunities.filter((o) => favorites.has(o.id));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Welcome banner */}
      <div className="bg-[#080808] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-[#FFD400]" />
            <h1 className="text-2xl md:text-3xl font-bold">
              Bonjour, <span className="text-[#FFD400]">{user.email?.split('@')[0]}</span>
            </h1>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Voici les opportunités sélectionnées pour toi selon ton profil.
          </p>
          {/* Profile summary */}
          <div className="flex flex-wrap gap-2">
            {answers.study_level && <Badge variant="yellow">{answers.study_level}</Badge>}
            {answers.destination && <Badge variant="yellow">{answers.destination}</Badge>}
            {answers.study_fields && answers.study_fields.length > 0 && (
              answers.study_fields.slice(0, 3).map((slug) => {
                const f = studyFields.find((sf) => sf.slug === slug);
                return f ? <Badge key={slug} variant="yellow">{f.name}</Badge> : null;
              })
            )}
            <button
              onClick={() => navigate('/questionnaire')}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-300 hover:text-[#FFD400] border border-white/20 rounded-full transition-colors"
            >
              <Target className="w-3 h-3" /> Modifier
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Recommended opportunities */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-[#080808] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#FFD400]" /> Les opportunités pour toi
            </h2>
            <Link to="/catalogue" className="text-sm font-semibold text-[#080808] hover:text-[#FFD400] inline-flex items-center gap-1">
              Tout voir <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {recommended.length === 0 ? (
            <EmptyState
              title="Aucune opportunité ne correspond encore à ton profil"
              message="Essaie d'élargir tes préférences ou consulte le catalogue général. De nouvelles opportunités sont publiées régulièrement."
              actionLabel="Voir le catalogue"
              onAction={() => navigate('/catalogue')}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {recommended.map((rec) => (
                <OpportunityCard
                  key={rec.opportunity.id}
                  opportunity={rec.opportunity}
                  isFavorite={favorites.has(rec.opportunity.id)}
                  onFavoriteToggle={() => toggleFav(rec.opportunity.id)}
                  matchReason={rec.reasons.length > 0 ? `Recommandée parce que ${rec.reasons[0]}` : undefined}
                />
              ))}
            </div>
          )}
        </section>

        {/* Upcoming deadlines */}
        {upcomingDeadlines.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-[#080808] flex items-center gap-2 mb-5">
              <Clock className="w-5 h-5 text-[#FFD400]" /> Les échéances à surveiller
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {upcomingDeadlines.map((opp) => (
                <Link
                  key={opp.id}
                  to={`/opportunite/${opp.slug}`}
                  className="bg-white rounded-xl border border-gray-200 p-4 nx-card"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${daysUntilDeadline(opp.deadline)! <= 7 ? 'bg-red-500' : 'bg-yellow-500'}`} />
                    <span className={`text-xs font-semibold ${deadlineColor(opp)}`}>{deadlineLabel(opp)}</span>
                  </div>
                  <h3 className="font-bold text-sm text-[#080808] line-clamp-2">{opp.title}</h3>
                  {opp.category && <p className="text-xs text-gray-400 mt-1">{opp.category.name}</p>}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* New matches */}
        {newMatches.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-[#080808] flex items-center gap-2 mb-5">
              <Sparkles className="w-5 h-5 text-[#FFD400]" /> Nouveautés correspondant à ton profil
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {newMatches.map((rec) => (
                <OpportunityCard
                  key={rec.opportunity.id}
                  opportunity={rec.opportunity}
                  isFavorite={favorites.has(rec.opportunity.id)}
                  onFavoriteToggle={() => toggleFav(rec.opportunity.id)}
                  matchReason={rec.reasons[0] ? `Recommandée parce que ${rec.reasons[0]}` : undefined}
                />
              ))}
            </div>
          </section>
        )}

        {/* Videos */}
        {videos.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-[#080808] flex items-center gap-2 mb-5">
              <VideoIcon className="w-5 h-5 text-[#FFD400]" /> Vidéos utiles pour tes objectifs
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </section>
        )}

        {/* Favorites */}
        <section>
          <h2 className="text-xl font-bold text-[#080808] flex items-center gap-2 mb-5">
            <Heart className="w-5 h-5 text-[#FFD400]" /> Tes favoris
          </h2>
          {favOpps.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <Heart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-3">Tu n'as pas encore enregistré de favoris.</p>
              <Link to="/catalogue" className="text-sm font-semibold text-[#080808] hover:text-[#FFD400]">
                Explorer les opportunités →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {favOpps.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  isFavorite={true}
                  onFavoriteToggle={() => toggleFav(opp.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
