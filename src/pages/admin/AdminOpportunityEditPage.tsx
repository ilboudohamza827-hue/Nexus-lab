import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter, Link } from '@/lib/router';
import { supabase } from '@/lib/supabase';
import type { Category, StudyField, OpportunityStatus } from '@/lib/types';
import { STATUS_LABELS, STUDY_LEVELS } from '@/lib/types';
import { LoadingSpinner } from '@/components/UI';
import { AdminSubHeader } from '@/pages/admin/AdminLayout';
import { slugify } from '@/lib/utils';
import { Save, ArrowLeft, Check, AlertCircle, Eye } from 'lucide-react';

export function AdminOpportunityEditPage({ id }: { id: string }) {
  const { isEditor, loading: authLoading, user } = useAuth();
  const { navigate } = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [studyFields, setStudyFields] = useState<StudyField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNew = id === 'new';

  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    category_id: '',
    organization: '',
    source_name: '',
    source_url: '',
    application_url: '',
    eligible_countries: '',
    eligible_nationalities: '',
    study_level: '',
    eligibility_criteria: '',
    academic_criteria: '',
    required_documents: '',
    open_date: '',
    deadline: '',
    fees: '',
    scholarship_amount: '',
    funding_type: '',
    status: 'brouillon' as OpportunityStatus,
    keywords: '',
    last_verified_at: '',
    selectedStudyFields: [] as string[],
  });

  useEffect(() => {
    if (!authLoading && !isEditor) navigate('/');
  }, [authLoading, isEditor, navigate]);

  useEffect(() => {
    async function load() {
      const [catRes, fieldRes] = await Promise.all([
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('study_fields').select('*').eq('is_active', true).order('sort_order'),
      ]);
      setCategories(catRes.data as Category[] ?? []);
      setStudyFields(fieldRes.data as StudyField[] ?? []);

      if (!isNew) {
        const { data } = await supabase
          .from('opportunities')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (data) {
          const d = data as Record<string, unknown>;
          setForm({
            title: (d.title as string) ?? '',
            slug: (d.slug as string) ?? '',
            description: (d.description as string) ?? '',
            category_id: (d.category_id as string) ?? '',
            organization: (d.organization as string) ?? '',
            source_name: (d.source_name as string) ?? '',
            source_url: (d.source_url as string) ?? '',
            application_url: (d.application_url as string) ?? '',
            eligible_countries: ((d.eligible_countries as string[]) ?? []).join(', '),
            eligible_nationalities: ((d.eligible_nationalities as string[]) ?? []).join(', '),
            study_level: (d.study_level as string) ?? '',
            eligibility_criteria: (d.eligibility_criteria as string) ?? '',
            academic_criteria: (d.academic_criteria as string) ?? '',
            required_documents: (d.required_documents as string) ?? '',
            open_date: (d.open_date as string) ?? '',
            deadline: (d.deadline as string) ?? '',
            fees: (d.fees as string) ?? '',
            scholarship_amount: (d.scholarship_amount as string) ?? '',
            funding_type: (d.funding_type as string) ?? '',
            status: (d.status as OpportunityStatus) ?? 'brouillon',
            keywords: ((d.keywords as string[]) ?? []).join(', '),
            last_verified_at: (d.last_verified_at as string) ?? '',
            selectedStudyFields: [],
          });

          // Load study field associations
          const { data: osf } = await supabase
            .from('opportunity_study_fields')
            .select('study_field_id')
            .eq('opportunity_id', id);
          if (osf) {
            setForm((prev) => ({ ...prev, selectedStudyFields: osf.map((o: { study_field_id: string }) => o.study_field_id) }));
          }
        }
      }
      setLoading(false);
    }
    if (isEditor) load();
  }, [isEditor, id, isNew]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(publish: boolean) {
    if (!form.title.trim()) {
      setError('Le titre est obligatoire.');
      return;
    }
    setSaving(true);
    setError(null);

    const slug = form.slug.trim() || slugify(form.title);
    const payload = {
      title: form.title.trim(),
      slug,
      description: form.description || null,
      category_id: form.category_id || null,
      organization: form.organization || null,
      source_name: form.source_name || null,
      source_url: form.source_url || null,
      application_url: form.application_url || null,
      eligible_countries: form.eligible_countries.split(',').map((s) => s.trim()).filter(Boolean),
      eligible_nationalities: form.eligible_nationalities.split(',').map((s) => s.trim()).filter(Boolean),
      study_level: form.study_level || null,
      eligibility_criteria: form.eligibility_criteria || null,
      academic_criteria: form.academic_criteria || null,
      required_documents: form.required_documents || null,
      open_date: form.open_date || null,
      deadline: form.deadline || null,
      fees: form.fees || null,
      scholarship_amount: form.scholarship_amount || null,
      funding_type: form.funding_type || null,
      status: publish ? 'publiee' as OpportunityStatus : form.status,
      keywords: form.keywords.split(',').map((s) => s.trim()).filter(Boolean),
      published_at: publish ? new Date().toISOString() : null,
      last_verified_at: form.last_verified_at || null,
      created_by: user?.id,
    };

    let oppId = id;
    if (isNew) {
      const { data, error: insErr } = await supabase.from('opportunities').insert(payload).select('id').single();
      if (insErr) {
        setError(insErr.message);
        setSaving(false);
        return;
      }
      oppId = (data as { id: string }).id;
    } else {
      const { error: updErr } = await supabase.from('opportunities').update(payload).eq('id', id);
      if (updErr) {
        setError(updErr.message);
        setSaving(false);
        return;
      }
    }

    // Update study field associations
    await supabase.from('opportunity_study_fields').delete().eq('opportunity_id', oppId);
    if (form.selectedStudyFields.length > 0) {
      await supabase
        .from('opportunity_study_fields')
        .insert(form.selectedStudyFields.map((sfId) => ({ opportunity_id: oppId, study_field_id: sfId })));
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      if (isNew) navigate(`/admin/opportunite/${oppId}`);
      else setSaved(false);
    }, 1000);
  }

  if (authLoading || loading) return <LoadingSpinner />;
  if (!isEditor) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSubHeader title={isNew ? 'Nouvelle opportunité' : 'Modifier l\'opportunité'} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/admin/opportunites" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#080808] mb-4">
          <ArrowLeft className="w-4 h-4" /> Retour à la liste
        </Link>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
        {saved && (
          <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-sm text-green-700">
            <Check className="w-4 h-4" /> Enregistré avec succès !
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          {/* Title */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Titre *</label>
              <input value={form.title} onChange={(e) => update('title', e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" placeholder="Titre de l'opportunité" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Slug (URL)</label>
              <input value={form.slug} onChange={(e) => update('slug', e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" placeholder="auto-généré" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={4} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400] resize-none" />
          </div>

          {/* Category & Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Catégorie</label>
              <select value={form.category_id} onChange={(e) => update('category_id', e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]">
                <option value="">Sélectionner...</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Niveau d'études</label>
              <select value={form.study_level} onChange={(e) => update('study_level', e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]">
                <option value="">Sélectionner...</option>
                {STUDY_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Organization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Organisme</label>
              <input value={form.organization} onChange={(e) => update('organization', e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Source (nom)</label>
              <input value={form.source_name} onChange={(e) => update('source_name', e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" />
            </div>
          </div>

          {/* URLs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">URL de la source</label>
              <input value={form.source_url} onChange={(e) => update('source_url', e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">URL de candidature</label>
              <input value={form.application_url} onChange={(e) => update('application_url', e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" placeholder="https://..." />
            </div>
          </div>

          {/* Countries & Nationalities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Pays éligibles (séparés par des virgules)</label>
              <input value={form.eligible_countries} onChange={(e) => update('eligible_countries', e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" placeholder="Burkina Faso, Mali, ..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nationalités éligibles</label>
              <input value={form.eligible_nationalities} onChange={(e) => update('eligible_nationalities', e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" />
            </div>
          </div>

          {/* Eligibility & Documents */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Conditions d'éligibilité</label>
              <textarea value={form.eligibility_criteria} onChange={(e) => update('eligibility_criteria', e.target.value)} rows={3} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400] resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Documents requis</label>
              <textarea value={form.required_documents} onChange={(e) => update('required_documents', e.target.value)} rows={3} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400] resize-none" />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Date d'ouverture</label>
              <input type="date" value={form.open_date} onChange={(e) => update('open_date', e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Date limite</label>
              <input type="date" value={form.deadline} onChange={(e) => update('deadline', e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" />
            </div>
          </div>

          {/* Funding */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Frais</label>
              <input value={form.fees} onChange={(e) => update('fees', e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Montant bourse</label>
              <input value={form.scholarship_amount} onChange={(e) => update('scholarship_amount', e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Type de financement</label>
              <input value={form.funding_type} onChange={(e) => update('funding_type', e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" />
            </div>
          </div>

          {/* Study fields */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Domaines d'études associés</label>
            <div className="flex flex-wrap gap-2">
              {studyFields.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    const sel = form.selectedStudyFields.includes(f.id)
                      ? form.selectedStudyFields.filter((s) => s !== f.id)
                      : [...form.selectedStudyFields, f.id];
                    update('selectedStudyFields', sel);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-colors ${
                    form.selectedStudyFields.includes(f.id)
                      ? 'border-[#FFD400] bg-yellow-50 text-[#080808]'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mots-clés (séparés par des virgules)</label>
            <input value={form.keywords} onChange={(e) => update('keywords', e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" />
          </div>

          {/* Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Statut</label>
              <select value={form.status} onChange={(e) => update('status', e.target.value as OpportunityStatus)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]">
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Dernière vérification</label>
              <input type="datetime-local" value={form.last_verified_at ? new Date(form.last_verified_at).toISOString().slice(0, 16) : ''} onChange={(e) => update('last_verified_at', e.target.value ? new Date(e.target.value).toISOString() : '')} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button onClick={() => handleSave(false)} disabled={saving} className="flex-1 py-3 bg-[#080808] text-white font-bold rounded-xl hover:bg-[#121212] transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> {saving ? 'Enregistrement...' : 'Enregistrer le brouillon'}
          </button>
          <button onClick={() => handleSave(true)} disabled={saving} className="flex-1 py-3 bg-[#FFD400] text-[#080808] font-bold rounded-xl hover:bg-yellow-300 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2">
            <Check className="w-4 h-4" /> {saving ? 'Publication...' : 'Vérifier et publier'}
          </button>
          {!isNew && form.slug && (
            <Link to={`/opportunite/${form.slug}`} className="px-5 py-3 border-2 border-gray-200 text-[#080808] font-semibold rounded-xl hover:border-[#080808] transition-colors inline-flex items-center justify-center gap-2">
              <Eye className="w-4 h-4" /> Voir
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
