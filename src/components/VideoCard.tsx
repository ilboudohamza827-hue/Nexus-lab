import type { Video } from '@/lib/types';
import { Link } from '@/lib/router';
import { Play, ExternalLink } from 'lucide-react';

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <div className="nx-card bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Thumbnail */}
      <a
        href={video.youtube_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative aspect-video bg-[#080808] group"
      >
        <img
          src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
          alt={video.title}
          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 bg-[#FFD400] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
            <Play className="w-6 h-6 text-[#080808] fill-current ml-1" />
          </div>
        </div>
      </a>

      {/* Content */}
      <div className="p-4">
        {video.video_category && (
          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-[#080808] text-[#FFD400] mb-2">
            {video.video_category}
          </span>
        )}
        <h3 className="font-bold text-sm text-[#080808] line-clamp-2 mb-1">
          {video.title}
        </h3>
        {video.channel_name && (
          <p className="text-xs text-gray-500 mb-2">{video.channel_name}</p>
        )}
        {video.description && (
          <p className="text-xs text-gray-600 line-clamp-2">{video.description}</p>
        )}
        <a
          href={video.youtube_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#080808] hover:text-[#FFD400] transition-colors mt-2"
        >
          Regarder sur YouTube <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
