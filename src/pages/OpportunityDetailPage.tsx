import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Opportunity, Video, StudyField } from '@/lib/types';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/types';
import { useRouter } from '@/lib/router';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { LoadingSpinner, EmptyState, Badge } from '@/components/UI';
import { VideoCard } from '@/components/VideoCard';
import {
  ArrowLeft, ExternalLink, Calendar, Building2, GraduationCap, MapPin, Globe,
  FileText, Award, DollarSign, Clock, BadgeCheck, AlertTriangle, Heart, Flag, Share2
} from 'lucide-react';
import { formatDate, formatDateTime, daysUntilDeadline, deadlineLabel, deadlineColor, isExpired } from '@/lib/utils';

export function OpportunityDetailPage({ slug }: { slug: string }) {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSent, setReportSent] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('opportunities')
        .select('*, category:categories(*), study_fields:opportunity_study_fields(study_field:study_fields(*))')
        .eq('slug', slug)
        .maybeSingle();

      if (data) {
        const opp = {
          ...data,
          study_fields: (data as unknown as { study_fields: { study_field: StudyField }[] }).study_fields?.map((s) => s.study_field) ?? [],
        } as unknown as Opportunity;
        setOpportunity(opp);

        // Load associated videos
        const { data: videoData } = await supabase
          .from('video_opportunities')
          .select('video:videos(*)')
          .eq('opportunity_id', opp.id)
          .eq('video.status', 'publiee');
        setVideos((videoData as unknown as { video: Video }[])?.map((v) => v.video) ?? []);

        // Check favorite
        if (user) {
          const { data: fav } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('opportunity_id', opp.id)
            .maybeSingle();
          setIsFav(!!fav);
        }
      }
      setLoading(false);
    }
    load();
  }, [slug, user]);

  async function toggleFavorite() {
    if (!user) {
      navigate('/connexion');
      return;
    }
    if (!opportunity) return;
    setFavLoading(true);
    try {
      if (isFav) {
        const { error } = await supabase.from('favorites').delete().eq('user_id', user.id).eq('opportunity_id', opportunity.id);
        if (error) throw error;
        setIsFav(false);
        toast('Retiré des favoris', 'info');
      } else {
        const { error } = await supabase.from('favorites').insert({ user_id: user.id, opportunity_id: opportunity.id });
        if (error) throw error;
        setIsFav(true);
        toast('Ajouté aux favoris', 'success');
      }
    } catch {
      toast('Une erreur est survenue', 'error');
    } finally {
      setFavLoading(false);
    }
  }

  async function submitReport() {
    if (!user || !opportunity || !reportReason) return;
    const { error } = await supabase.from('reports').insert({
      opportunity_id: opportunity.id,
      user_id: user.id,
      reason: reportReason,
      details: reportDetails || null,
    });
    if (error) {
      toast('Une erreur est survenue', 'error');
      return;
    }
    toast('Signalement envoyé', 'success');
    setReportSent(true);
    setTimeout(() => {
      setShowReport(false);
      setReportSent(false);
      setReportReason('');
      setReportDetails('');
    }, 2000);
  }

  function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: opportunity?.title ?? 'Opportunité NexusLab', url }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast('Lien copié dans le presse-papiers', 'success');
    }
  }

  if (loading) return <LoadingSpinner />;
  if (!opportunity) {
    return (
      <EmptyState
        title="Opportunité introuvable"
        message="Cette opportunité n'existe pas ou n'est plus disponible."
        actionLabel="Retour au catalogue"
        onAction={() => navigate('/catalogue')}
      />
    );
  }

  const expired = isExpired(opportunity);
  const days = daysUntilDeadline(opportunity.deadline);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <button
            onClick={() => navigate('/catalogue')}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#080808] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Retour au catalogue
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
          <div className="p-6 md:p-8">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {opportunity.category && (
                <Badge variant="dark">{opportunity.category.name}</Badge>
              )}
              {opportunity.last_verified_at && !expired && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                  <BadgeCheck className="w-3.5 h-3.5" /> Vérifiée le {formatDate(opportunity.last_verified_at)}
                </span>
              )}
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[opportunity.status]}`}>
                {STATUS_LABELS[opportunity.status]}
              </span>
              {expired && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  <AlertTriangle className="w-3.5 h-3.5" /> Expirée
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-[#080808] mb-3">
              {opportunity.title}
            </h1>

            {opportunity.organization && (
              <p className="text-gray-500 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-gray-500" /> {opportunity.organization}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mt-6">
              {opportunity.application_url && !expired && (
                <a
                  href={opportunity.application_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-[#FFD400] text-[#080808] font-bold rounded-xl hover:bg-yellow-300 transition-colors inline-flex items-center gap-2"
                >
                  Postuler maintenant <ExternalLink className="w-4 h-4" />
                </a>
              )}
              {opportunity.source_url && (
                <a
                  href={opportunity.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 border-2 border-gray-200 text-[#080808] font-semibold rounded-xl hover:border-[#080808] transition-colors inline-flex items-center gap-2"
                >
                  Voir la source officielle <Globe className="w-4 h-4" />
                </a>
              )}
              <button
                onClick={toggleFavorite}
                disabled={favLoading}
                className={`px-4 py-3 rounded-xl border-2 font-semibold transition-colors inline-flex items-center gap-2 ${
                  isFav
                    ? 'border-red-200 text-red-600 bg-red-50'
                    : 'border-gray-200 text-gray-700 hover:border-red-200 hover:text-red-600'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                {isFav ? 'Sauvegardé' : 'Sauvegarder'}
              </button>
                <button
                  onClick={handleShare}
                  className="px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-700 hover:border-[#080808] transition-colors inline-flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" /> Partager
                </button>
                {user && (
                  <button
                    onClick={() => setShowReport(true)}
                    className="px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-600 transition-colors inline-flex items-center gap-2"
                  >
                    <Flag className="w-4 h-4" /> Signaler
                  </button>
                )}
            </div>
          </div>

          {/* Deadline banner */}
          {!expired && days !== null && days <= 30 && (
            <div className={`px-6 md:px-8 py-3 ${days <= 7 ? 'bg-red-50' : 'bg-yellow-50'}`}>
              <p className={`text-sm font-semibold flex items-center gap-2 ${days <= 7 ? 'text-red-700' : 'text-yellow-800'}`}>
                <Clock className="w-4 h-4" />
                {deadlineLabel(opportunity)}
              </p>
            </div>
          )}
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {opportunity.description && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-bold text-lg text-[#080808] mb-3">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{opportunity.description}</p>
              </div>
            )}

            {opportunity.eligibility_criteria && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-bold text-lg text-[#080808] mb-3">Conditions d'éligibilité</h2>
                <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{opportunity.eligibility_criteria}</p>
              </div>
            )}

            {opportunity.academic_criteria && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-bold text-lg text-[#080808] mb-3">Critères académiques</h2>
                <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{opportunity.academic_criteria}</p>
              </div>
            )}

            {opportunity.required_documents && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-bold text-lg text-[#080808] mb-3">Documents requis</h2>
                <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{opportunity.required_documents}</p>
              </div>
            )}

            {/* Associated videos */}
            {videos.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-bold text-lg text-[#080808] mb-4">Vidéos utiles</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {videos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-bold text-sm text-[#080808] mb-4">Informations clés</h3>
              <dl className="space-y-3 text-sm">
                <InfoRow icon={<Clock className="w-4 h-4" />} label="Date limite" value={deadlineLabel(opportunity)} valueClass={deadlineColor(opportunity)} />
                <InfoRow icon={<Calendar className="w-4 h-4" />} label="Date d'ouverture" value={formatDate(opportunity.open_date)} />
                <InfoRow icon={<GraduationCap className="w-4 h-4" />} label="Niveau requis" value={opportunity.study_level || 'Non précisé'} />
                {opportunity.eligible_countries.length > 0 && (
                  <InfoRow icon={<MapPin className="w-4 h-4" />} label="Pays éligibles" value={opportunity.eligible_countries.join(', ')} />
                )}
                {opportunity.eligible_nationalities.length > 0 && (
                  <InfoRow icon={<Globe className="w-4 h-4" />} label="Nationalités" value={opportunity.eligible_nationalities.join(', ')} />
                )}
                {opportunity.fees && (
                  <InfoRow icon={<DollarSign className="w-4 h-4" />} label="Frais" value={opportunity.fees} />
                )}
                {opportunity.scholarship_amount && (
                  <InfoRow icon={<Award className="w-4 h-4" />} label="Montant" value={opportunity.scholarship_amount} />
                )}
                {opportunity.funding_type && (
                  <InfoRow icon={<FileText className="w-4 h-4" />} label="Type de financement" value={opportunity.funding_type} />
                )}
                {opportunity.source_name && (
                  <InfoRow icon={<Building2 className="w-4 h-4" />} label="Source" value={opportunity.source_name} />
                )}
              </dl>
            </div>

            {/* Study fields */}
            {opportunity.study_fields && opportunity.study_fields.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-bold text-sm text-[#080808] mb-3">Domaines concernés</h3>
                <div className="flex flex-wrap gap-2">
                  {opportunity.study_fields.map((field) => (
                    <Badge key={field.id}>{field.name}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Verification info */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-bold text-sm text-[#080808] mb-3">Vérification</h3>
              <dl className="space-y-2 text-sm">
                <InfoRow label="Publiée le" value={formatDate(opportunity.published_at)} />
                <InfoRow label="Dernière vérification" value={opportunity.last_verified_at ? formatDateTime(opportunity.last_verified_at) : 'Non vérifiée'} />
              </dl>
              <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                NexusLab informe et oriente les candidats. Il ne garantit ni l'obtention d'une bourse,
                ni une admission, ni une sélection.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Report modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowReport(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            {reportSent ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BadgeCheck className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold text-[#080808] mb-1">Signalement envoyé</h3>
                <p className="text-sm text-gray-500">Merci, l'équipe NexusLab va vérifier cette annonce.</p>
              </div>
            ) : (
              <>
                <h3 className="font-bold text-lg text-[#080808] mb-4">Signaler une erreur</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Raison du signalement</label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]"
                    >
                      <option value="">Sélectionner...</option>
                      <option value="Lien cassé">Lien cassé</option>
                      <option value="Date limite incorrecte">Date limite incorrecte</option>
                      <option value="Information erronée">Information erronée</option>
                      <option value="Opportunité expirée">Opportunité expirée</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Détails (facultatif)</label>
                    <textarea
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      rows={3}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400] resize-none"
                      placeholder="Décris le problème..."
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowReport(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-lg"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={submitReport}
                      disabled={!reportReason}
                      className="px-4 py-2 text-sm font-bold bg-[#FFD400] text-[#080808] rounded-lg disabled:opacity-50"
                    >
                      Envoyer
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value, valueClass }: { icon?: React.ReactNode; label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="flex items-center gap-2 text-gray-500 flex-shrink-0">
        {icon && <span className="text-gray-500">{icon}</span>}
        {label}
      </dt>
      <dd className={`text-right font-medium ${valueClass || 'text-[#080808]'}`}>{value}</dd>
    </div>
  );
}


