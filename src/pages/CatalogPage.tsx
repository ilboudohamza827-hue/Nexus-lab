import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Opportunity, Category, StudyField } from '@/lib/types';
import { STUDY_LEVELS, DESTINATIONS } from '@/lib/types';
import { OpportunityCard } from '@/components/OpportunityCard';
import { LoadingSpinner, EmptyState } from '@/components/UI';
import { useAuth } from '@/lib/auth';
import { useRouter, Link } from '@/lib/router';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

export function CatalogPage() {
  const { path } = useRouter();
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [studyFields, setStudyFields] = useState<StudyField[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedField, setSelectedField] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('');
  const [sortBy, setSortBy] = useState<'pertinence' | 'recent' | 'deadline'>('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const PAGE_SIZE = 9;

  // Parse URL params on mount
  useEffect(() => {
    const url = new URL(window.location.href);
    const q = url.searchParams.get('q');
    const cat = url.searchParams.get('category');
    if (q) setSearchQuery(q);
    if (cat) setSelectedCategory(cat);
  }, [path]);

  // Load categories and study fields
  useEffect(() => {
    async function loadMeta() {
      const [catRes, fieldRes] = await Promise.all([
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('study_fields').select('*').eq('is_active', true).order('sort_order'),
      ]);
      setCategories(catRes.data as Category[] ?? []);
      setStudyFields(fieldRes.data as StudyField[] ?? []);
    }
    loadMeta();
  }, []);

  // Load favorites
  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    async function loadFavs() {
      const { data } = await supabase
        .from('favorites')
        .select('opportunity_id')
        .eq('user_id', userId);
      if (data) {
        setFavorites(new Set(data.map((f: { opportunity_id: string }) => f.opportunity_id)));
      }
    }
    loadFavs();
  }, [user]);

  const loadOpportunities = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('opportunities')
      .select('*, category:categories(*)', { count: 'exact' })
      .eq('status', 'publiee');

    if (searchQuery.trim()) {
      query = query.or(`title.ilike.%${searchQuery.trim()}%,description.ilike.%${searchQuery.trim()}%,keywords.cs.{${searchQuery.trim()}}`);
    }
    if (selectedCategory) {
      const cat = categories.find((c) => c.slug === selectedCategory);
      if (cat) query = query.eq('category_id', cat.id);
    }
    if (selectedLevel) {
      query = query.eq('study_level', selectedLevel);
    }
    if (selectedDestination) {
      query = query.contains('eligible_countries', [selectedDestination]);
    }

    if (sortBy === 'recent') {
      query = query.order('published_at', { ascending: false, nullsFirst: false });
    } else if (sortBy === 'deadline') {
      query = query.order('deadline', { ascending: true, nullsFirst: false });
    } else {
      query = query.order('published_at', { ascending: false, nullsFirst: false });
    }

    const from = (currentPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);

    const { data, count } = await query;
    setOpportunities((data as unknown as Opportunity[]) ?? []);
    setTotalCount(count ?? 0);
    setLoading(false);
  }, [searchQuery, selectedCategory, selectedLevel, selectedDestination, sortBy, currentPage, categories]);

  useEffect(() => {
    loadOpportunities();
  }, [loadOpportunities]);

  // Filter by study field client-side (would need junction query for server-side)
  const filteredOpportunities = selectedField
    ? opportunities.filter((o) => o.study_fields?.some((f) => f.slug === selectedField))
    : opportunities;

  function clearFilters() {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedLevel('');
    setSelectedField('');
    setSelectedDestination('');
    setSortBy('recent');
    setCurrentPage(1);
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const activeFilterCount = [selectedCategory, selectedLevel, selectedField, selectedDestination].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#080808] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Catalogue des <span className="text-[#FFD400]">opportunités</span>
          </h1>
          <p className="text-gray-500 text-sm">
            {totalCount > 0 ? `${totalCount} opportunité${totalCount > 1 ? 's' : ''} disponible${totalCount > 1 ? 's' : ''}` : 'Explore toutes les opportunités éducatives'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search bar */}
        <div className="mb-6 flex gap-3">
          <div className="flex-1 flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-4 py-2.5">
            <Search className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Rechercher par mot-clé..."
              className="flex-1 outline-none text-sm text-[#080808]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-500 hover:text-gray-500">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`md:hidden px-4 py-2.5 rounded-xl border font-medium text-sm flex items-center gap-2 ${
              showFilters ? 'bg-[#FFD400] text-[#080808] border-[#FFD400]' : 'bg-white text-gray-700 border-gray-200'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtres {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters sidebar */}
          <aside className={`md:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden md:block'}`}>
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5 sticky top-20">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#080808]">Filtres</h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-gray-500 hover:text-[#FFD400] flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Effacer
                  </button>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Catégorie</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400] bg-white"
                >
                  <option value="">Toutes</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Study level */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Niveau d'études</label>
                <select
                  value={selectedLevel}
                  onChange={(e) => { setSelectedLevel(e.target.value); setCurrentPage(1); }}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400] bg-white"
                >
                  <option value="">Tous les niveaux</option>
                  {STUDY_LEVELS.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              {/* Study field */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Domaine d'études</label>
                <select
                  value={selectedField}
                  onChange={(e) => { setSelectedField(e.target.value); setCurrentPage(1); }}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400] bg-white"
                >
                  <option value="">Tous les domaines</option>
                  {studyFields.map((field) => (
                    <option key={field.id} value={field.slug}>{field.name}</option>
                  ))}
                </select>
              </div>

              {/* Destination */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Zone géographique</label>
                <select
                  value={selectedDestination}
                  onChange={(e) => { setSelectedDestination(e.target.value); setCurrentPage(1); }}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400] bg-white"
                >
                  <option value="">Toutes les zones</option>
                  {DESTINATIONS.map((dest) => (
                    <option key={dest} value={dest}>{dest}</option>
                  ))}
                </select>
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1">
            {/* Sort bar */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {loading ? 'Chargement...' : `${totalCount} résultat${totalCount > 1 ? 's' : ''}`}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Trier par:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-[#FFD400] bg-white"
                >
                  <option value="recent">Plus récentes</option>
                  <option value="deadline">Date limite</option>
                  <option value="pertinence">Pertinence</option>
                </select>
              </div>
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : filteredOpportunities.length === 0 ? (
              <EmptyState
                title="Aucune opportunité trouvée"
                message="Aucune opportunité ne correspond à tes critères de recherche. Essaie d'élargir tes filtres ou de consulter tout le catalogue."
                actionLabel="Effacer les filtres"
                onAction={clearFilters}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredOpportunities.map((opp) => (
                    <OpportunityCard
                      key={opp.id}
                      opportunity={opp}
                      isFavorite={favorites.has(opp.id)}
                      onFavoriteToggle={() => {
                        setFavorites((prev) => {
                          const next = new Set(prev);
                          if (next.has(opp.id)) next.delete(opp.id);
                          else next.add(opp.id);
                          return next;
                        });
                      }}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-[#FFD400] transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages)
                      .map((page, idx, arr) => (
                        <span key={page} className="flex items-center gap-1">
                          {idx > 0 && arr[idx - 1] !== page - 1 && (
                            <span className="text-gray-500 px-1">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`w-9 h-9 rounded-lg font-medium text-sm transition-colors ${
                              currentPage === page
                                ? 'bg-[#FFD400] text-[#080808]'
                                : 'border border-gray-200 hover:border-[#FFD400] text-gray-700'
                            }`}
                          >
                            {page}
                          </button>
                        </span>
                      ))}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-[#FFD400] transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
