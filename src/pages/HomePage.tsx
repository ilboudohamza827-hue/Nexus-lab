import { useEffect, useState } from 'react';
import { Link, useRouter } from '@/lib/router';
import { supabase } from '@/lib/supabase';
import type { Opportunity, Category, Video } from '@/lib/types';
import { OpportunityCard } from '@/components/OpportunityCard';
import { VideoCard } from '@/components/VideoCard';
import { LoadingSpinner } from '@/components/UI';
import { Search, ArrowRight, Compass, Target, ShieldCheck, BookOpen, Video as VideoIcon, Sparkles, Calendar } from 'lucide-react';
import { deadlineLabel, deadlineColor, isExpired } from '@/lib/utils';
export function HomePage() {
  const { navigate } = useRouter();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function load() {
      const [oppResult, catResult, vidResult] = await Promise.all([
        supabase
          .from('opportunities')
          .select('*, category:categories(*)')
          .eq('status', 'publiee')
          .order('published_at', { ascending: false })
          .limit(6),
        supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order'),
        supabase
          .from('videos')
          .select('*')
          .eq('status', 'publiee')
          .order('created_at', { ascending: false })
          .limit(4),
      ]);
      setOpportunities(oppResult.data as unknown as Opportunity[] ?? []);
      setCategories(catResult.data as Category[] ?? []);
      setVideos(vidResult.data as Video[] ?? []);
      setLoading(false);
    }
    load();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalogue?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/catalogue');
    }
  }

  const upcomingDeadlines = [...opportunities]
    .filter((o) => o.deadline && !isExpired(o))
    .sort((a, b) => (a.deadline! < b.deadline! ? -1 : 1))
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-[#080808] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #FFD400 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20 relative">
          <div className="hidden lg:block absolute right-8 xl:right-20 top-1/2 -translate-y-1/2 w-44 h-64 opacity-20 pointer-events-none">
            <img src="/NEXUS.jpeg" alt="" className="w-full h-full object-contain" />
          </div>
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex justify-center mb-5 lg:hidden">
              <div className="w-20 h-20 rounded-2xl overflow-hidden ring-1 ring-[#FFD400]/40 shadow-lg shadow-black/30">
                <img src="/NEXUS.jpeg" alt="Logo NexusLab" className="w-full h-full object-cover object-center" />
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FFD400]/10 border border-[#FFD400]/30 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-[#FFD400]" />
              <span className="text-sm text-[#FFD400] font-medium">NexusLab · plateforme éducative gratuite</span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
              Le potentiel est partout.<br />
              Les opportunités doivent <span className="text-[#FFD400]">l'être aussi.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-500 mb-8 max-w-2xl mx-auto">
              Découvre les bourses, formations, concours et opportunités qui correspondent à ton parcours.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-8">
              <div className="flex items-center gap-2 bg-white rounded-xl p-1.5 shadow-2xl">
                <Search className="w-5 h-5 text-gray-500 ml-3 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une bourse, formation, concours..."
                  className="flex-1 py-2.5 px-2 text-[#080808] outline-none text-sm md:text-base bg-transparent"
                />
                <button
                  type="submit"
                  className="px-4 md:px-6 py-2.5 bg-[#FFD400] text-[#080808] font-bold rounded-lg hover:bg-yellow-300 transition-colors text-sm md:text-base"
                >
                  Rechercher
                </button>
              </div>
            </form>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/catalogue"
                className="px-6 py-3 bg-[#FFD400] text-[#080808] font-bold rounded-xl hover:bg-yellow-300 transition-colors inline-flex items-center justify-center gap-2"
              >
                <Compass className="w-5 h-5" /> Explorer les opportunités
              </Link>
              <Link
                to="/questionnaire"
                className="px-6 py-3 border-2 border-white/20 text-white font-bold rounded-xl hover:bg-white/5 transition-colors inline-flex items-center justify-center gap-2"
              >
                <Target className="w-5 h-5" /> Personnaliser mon espace
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Latest opportunities */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#080808]">
            Dernières <span className="text-[#FFD400] nx-underline">opportunités</span>
          </h2>
          <Link to="/catalogue" className="text-sm font-semibold text-[#080808] hover:text-[#FFD400] inline-flex items-center gap-1 transition-colors">
            Voir tout <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : opportunities.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="font-bold text-lg text-[#080808] mb-2">Aucune opportunité publiée pour le moment</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Les opportunités seront publiées au fur et à mesure de leur vérification par l'équipe NexusLab.
              Reviens bientôt ou personnalise ton espace pour être informé des nouveautés.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {opportunities.map((opp) => (
              <OpportunityCard key={opp.id} opportunity={opp} isFavorite={false} />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming deadlines */}
      {!loading && upcomingDeadlines.length > 0 && (
        <section className="bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-[#080808] mb-6">
              Échéances <span className="text-[#FFD400] nx-underline">à venir</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {upcomingDeadlines.map((opp) => (
                <Link
                  key={opp.id}
                  to={`/opportunite/${opp.slug}`}
                  className="bg-white rounded-xl border border-gray-200 p-5 nx-card flex flex-col"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-[#FFD400]" />
                    <span className={`text-sm font-semibold ${deadlineColor(opp)}`}>
                      {deadlineLabel(opp)}
                    </span>
                  </div>
                  <h3 className="font-bold text-[#080808] line-clamp-2 mb-2">{opp.title}</h3>
                  {opp.category && (
                    <span className="text-xs text-gray-500">{opp.category.name}</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      {!loading && categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-[#080808] mb-6">
            Catégories <span className="text-[#FFD400] nx-underline">populaires</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {categories.slice(0, 10).map((cat) => (
              <Link
                key={cat.id}
                to={`/catalogue?category=${cat.slug}`}
                className="bg-white border border-gray-200 rounded-xl p-4 nx-card text-center group"
              >
                <div className="w-10 h-10 bg-[#080808] rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-[#FFD400] transition-colors">
                  <BookOpen className="w-5 h-5 text-[#FFD400] group-hover:text-[#080808] transition-colors" />
                </div>
                <p className="text-xs font-medium text-[#080808] line-clamp-2">{cat.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="bg-[#080808] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Comment fonctionne <span className="text-[#FFD400]">NexusLab</span> ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#FFD400] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Compass className="w-8 h-8 text-[#080808]" />
              </div>
              <h3 className="font-bold text-lg mb-2">1. Explore le catalogue</h3>
              <p className="text-sm text-gray-500">
                Parcours librement toutes les opportunités publiées. Recherche par mot-clé, filtre par
                catégorie, niveau, domaine et pays.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#FFD400] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-[#080808]" />
              </div>
              <h3 className="font-bold text-lg mb-2">2. Personnalise ton profil</h3>
              <p className="text-sm text-gray-500">
                Réponds au questionnaire pour recevoir des recommandations adaptées à ton niveau,
                tes objectifs et tes domaines d'intérêt.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#FFD400] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-[#080808]" />
              </div>
              <h3 className="font-bold text-lg mb-2">3. Postule en confiance</h3>
              <p className="text-sm text-gray-500">
                Accède aux sources officielles et aux liens de candidature. Chaque annonce est
                rattachée à une source vérifiable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Videos section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#080808]">
            Ressources <span className="text-[#FFD400] nx-underline">vidéo</span>
          </h2>
          <Link to="/videos" className="text-sm font-semibold text-[#080808] hover:text-[#FFD400] inline-flex items-center gap-1 transition-colors">
            Toutes les vidéos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
            <VideoIcon className="w-12 h-12 text-[#FFD400] mx-auto mb-3" />
            <p className="text-sm text-gray-500 max-w-lg mx-auto">
              Des vidéos éducatives pour t'aider à préparer tes candidatures, rédiger ton CV,
              préparer un entretien et bien plus. Disponible prochainement.
            </p>
            <Link
              to="/videos"
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-[#080808] text-white font-semibold rounded-lg hover:bg-[#FFD400] hover:text-[#080808] transition-colors"
            >
              Découvrir les vidéos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
