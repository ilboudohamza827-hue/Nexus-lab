import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Video } from '@/lib/types';
import { VIDEO_CATEGORIES } from '@/lib/types';
import { VideoCard } from '@/components/VideoCard';
import { LoadingSpinner, EmptyState } from '@/components/UI';
import { Video as VideoIcon, Search, X } from 'lucide-react';

export function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      let query = supabase.from('videos').select('*').eq('status', 'publiee').order('created_at', { ascending: false });
      if (selectedCategory) {
        query = query.eq('video_category', selectedCategory);
      }
      const { data } = await query;
      setVideos(data as Video[] ?? []);
      setLoading(false);
    }
    load();
  }, [selectedCategory]);

  const filtered = search
    ? videos.filter((v) =>
        v.title.toLowerCase().includes(search.toLowerCase()) ||
        v.keywords.some((k) => k.toLowerCase().includes(search.toLowerCase()))
      )
    : videos;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#080808] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 mb-2">
            <VideoIcon className="w-6 h-6 text-[#FFD400]" /> Bibliothèque vidéo
          </h1>
          <p className="text-gray-500 text-sm">
            Des ressources éducatives pour t'aider à préparer tes candidatures et développer tes compétences.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6 flex gap-3">
          <div className="flex-1 flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-4 py-2.5">
            <Search className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une vidéo..."
              className="flex-1 outline-none text-sm text-[#080808]"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-gray-500 hover:text-gray-500">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !selectedCategory ? 'bg-[#FFD400] text-[#080808]' : 'bg-white border border-gray-200 text-gray-700 hover:border-[#FFD400]'
            }`}
          >
            Toutes
          </button>
          {VIDEO_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat ? 'bg-[#FFD400] text-[#080808]' : 'bg-white border border-gray-200 text-gray-700 hover:border-[#FFD400]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Aucune vidéo disponible"
            message="Les vidéos éducatives seront publiées progressivement par l'équipe NexusLab. Reviens bientôt !"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
