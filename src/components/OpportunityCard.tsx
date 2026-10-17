import type { Opportunity } from '@/lib/types';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/types';
import { Link } from '@/lib/router';
import { deadlineLabel, deadlineColor, isExpired } from '@/lib/utils';
import { Heart, MapPin, GraduationCap, Building2, Clock, ArrowRight, BadgeCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface OpportunityCardProps {
  opportunity: Opportunity;
  isFavorite: boolean;
  onFavoriteToggle?: () => void;
  matchReason?: string;
}

export function OpportunityCard({ opportunity, isFavorite, onFavoriteToggle, matchReason }: OpportunityCardProps) {
  const { user } = useAuth();
  const [favLoading, setFavLoading] = useState(false);
  const expired = isExpired(opportunity);

  async function toggleFavorite() {
    if (!user) return;
    setFavLoading(true);
    try {
      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('opportunity_id', opportunity.id);
      } else {
        await supabase
          .from('favorites')
          .insert({ user_id: user.id, opportunity_id: opportunity.id });
      }
      onFavoriteToggle?.();
    } finally {
      setFavLoading(false);
    }
  }

  return (
    <div className={`nx-card bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col ${expired ? 'opacity-75' : ''}`}>
      <div className="p-5 flex-1">
        {/* Category badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap gap-2">
            {opportunity.category && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#080808] text-[#FFD400]">
                {opportunity.category.name}
              </span>
            )}
            {opportunity.last_verified_at && !expired && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                <BadgeCheck className="w-3 h-3" /> Vérifiée
              </span>
            )}
            {expired && (
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS.expiree}`}>
                Expirée
              </span>
            )}
          </div>
          {user && (
            <button
              onClick={toggleFavorite}
              disabled={favLoading}
              className={`p-1.5 rounded-lg transition-colors ${
                isFavorite
                  ? 'text-red-500 hover:bg-red-50'
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              }`}
              title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        {/* Title */}
        <Link to={`/opportunite/${opportunity.slug}`}>
          <h3 className="font-bold text-lg text-[#080808] hover:text-[#FFD400] transition-colors line-clamp-2 mb-2">
            {opportunity.title}
          </h3>
        </Link>

        {/* Match reason */}
        {matchReason && (
          <div className="mb-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{matchReason}</span>
            </p>
          </div>
        )}

        {/* Meta info */}
        <div className="space-y-1.5 text-sm text-gray-600">
          {opportunity.organization && (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">{opportunity.organization}</span>
            </div>
          )}
          {opportunity.study_level && (
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span>{opportunity.study_level}</span>
            </div>
          )}
          {opportunity.eligible_countries.length > 0 && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">{opportunity.eligible_countries.join(', ')}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 flex-shrink-0 ${expired ? 'text-gray-400' : 'text-gray-400'}`} />
            <span className={expired ? 'text-gray-400' : deadlineColor(opportunity)}>
              {deadlineLabel(opportunity)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pb-5 pt-2 border-t border-gray-100 flex items-center justify-between">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[opportunity.status]}`}>
          {STATUS_LABELS[opportunity.status]}
        </span>
        <Link
          to={`/opportunite/${opportunity.slug}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-[#080808] hover:text-[#FFD400] transition-colors"
        >
          Voir les détails <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
