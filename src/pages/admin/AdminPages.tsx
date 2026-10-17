import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter, Link } from '@/lib/router';
import { supabase } from '@/lib/supabase';
import type { Video, Category, StudyField, Profile, Report, VideoStatus, ReportStatus } from '@/lib/types';
import { VIDEO_CATEGORIES, STATUS_LABELS } from '@/lib/types';
import { LoadingSpinner, EmptyState } from '@/components/UI';
import { AdminSubHeader } from '@/pages/admin/AdminLayout';
import { slugify, extractYouTubeId, formatDate } from '@/lib/utils';
import { Plus, Edit, Trash2, Save, X, Check, AlertCircle, Flag, Video as VideoIcon } from 'lucide-react';

// ============================================================
// VIDEOS ADMIN
// ============================================================

export function AdminVideosPage() {
  const { isEditor, loading: authLoading, user } = useAuth();
  const { navigate } = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', youtube_url: '', channel_name: '', description: '', video_category: '', study_level: '', keywords: '', status: 'brouillon' as VideoStatus });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from('videos').select('*').order('created_at', { ascending: false });
    setVideos((data as Video[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !isEditor) navigate('/');
  }, [authLoading, isEditor, navigate]);

  useEffect(() => { if (isEditor) load(); }, [isEditor, load]);

  function resetForm() {
    setForm({ title: '', youtube_url: '', channel_name: '', description: '', video_category: '', study_level: '', keywords: '', status: 'brouillon' });
    setEditId(null);
    setShowForm(false);
    setError(null);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.youtube_url.trim()) {
      setError('Le titre et l\'URL YouTube sont obligatoires.');
      return;
    }
    const ytId = extractYouTubeId(form.youtube_url);
    if (!ytId) {
      setError('URL YouTube invalide.');
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      title: form.title.trim(),
      youtube_url: form.youtube_url.trim(),
      youtube_id: ytId,
      channel_name: form.channel_name || null,
      description: form.description || null,
      video_category: form.video_category || null,
      study_level: form.study_level || null,
      keywords: form.keywords.split(',').map((s) => s.trim()).filter(Boolean),
      status: form.status,
      created_by: user?.id,
    };
    if (editId) {
      await supabase.from('videos').update(payload).eq('id', editId);
    } else {
      await supabase.from('videos').insert(payload);
    }
    setSaving(false);
    resetForm();
    load();
  }

  function startEdit(video: Video) {
    setEditId(video.id);
    setForm({
      title: video.title,
      youtube_url: video.youtube_url,
      channel_name: video.channel_name ?? '',
      description: video.description ?? '',
      video_category: video.video_category ?? '',
      study_level: video.study_level ?? '',
      keywords: video.keywords.join(', '),
      status: video.status,
    });
    setShowForm(true);
  }

  async function deleteVideo(id: string) {
    if (!confirm('Supprimer cette vidéo ?')) return;
    await supabase.from('videos').delete().eq('id', id);
    load();
  }

  if (authLoading || loading) return <LoadingSpinner />;
  if (!isEditor) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSubHeader title="Gestion des vidéos" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4">
          <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="px-5 py-2.5 bg-[#FFD400] text-[#080808] font-bold text-sm rounded-xl hover:bg-yellow-300 transition-colors inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> {showForm ? 'Annuler' : 'Ajouter une vidéo'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4">
            {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700"><AlertCircle className="w-4 h-4" /> {error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Titre *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">URL YouTube *</label>
                <input value={form.youtube_url} onChange={(e) => setForm({ ...form, youtube_url: e.target.value })} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" placeholder="https://youtube.com/watch?v=..." />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Chaîne</label>
                <input value={form.channel_name} onChange={(e) => setForm({ ...form, channel_name: e.target.value })} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Catégorie</label>
                <select value={form.video_category} onChange={(e) => setForm({ ...form, video_category: e.target.value })} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]">
                  <option value="">Sélectionner...</option>
                  {VIDEO_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Statut</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as VideoStatus })} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]">
                  <option value="brouillon">Brouillon</option>
                  <option value="publiee">Publiée</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400] resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mots-clés (séparés par des virgules)</label>
              <input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" />
            </div>
            <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 bg-[#080808] text-white font-bold text-sm rounded-xl hover:bg-[#121212] inline-flex items-center gap-2 disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? 'Enregistrement...' : editId ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        )}

        {videos.length === 0 ? (
          <EmptyState title="Aucune vidéo" message="Ajoute ta première vidéo éducative." />
        ) : (
          <div className="space-y-2">
            {videos.map((video) => (
              <div key={video.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                <img src={`https://img.youtube.com/vi/${video.youtube_id}/default.jpg`} alt="" className="w-20 h-14 rounded object-cover flex-shrink-0" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#080808] line-clamp-1">{video.title}</p>
                  <p className="text-xs text-gray-400">{video.channel_name} • {video.video_category}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${video.status === 'publiee' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {video.status === 'publiee' ? 'Publiée' : 'Brouillon'}
                  </span>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => startEdit(video)} className="p-2 text-gray-400 hover:text-[#FFD400]"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => deleteVideo(video.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// CATEGORIES & STUDY FIELDS ADMIN
// ============================================================

export function AdminCategoriesPage() {
  const { isEditor, loading: authLoading } = useAuth();
  const { navigate } = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [studyFields, setStudyFields] = useState<StudyField[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCatName, setNewCatName] = useState('');
  const [newFieldName, setNewFieldName] = useState('');

  const load = useCallback(async () => {
    const [catRes, fieldRes] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('study_fields').select('*').order('sort_order'),
    ]);
    setCategories(catRes.data as Category[] ?? []);
    setStudyFields(fieldRes.data as StudyField[] ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !isEditor) navigate('/');
  }, [authLoading, isEditor, navigate]);

  useEffect(() => { if (isEditor) load(); }, [isEditor, load]);

  async function addCategory() {
    if (!newCatName.trim()) return;
    await supabase.from('categories').insert({ name: newCatName.trim(), slug: slugify(newCatName) });
    setNewCatName('');
    load();
  }

  async function toggleCategoryActive(cat: Category) {
    await supabase.from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id);
    load();
  }

  async function deleteCategory(id: string) {
    if (!confirm('Supprimer cette catégorie ?')) return;
    await supabase.from('categories').delete().eq('id', id);
    load();
  }

  async function addField() {
    if (!newFieldName.trim()) return;
    await supabase.from('study_fields').insert({ name: newFieldName.trim(), slug: slugify(newFieldName) });
    setNewFieldName('');
    load();
  }

  async function toggleFieldActive(field: StudyField) {
    await supabase.from('study_fields').update({ is_active: !field.is_active }).eq('id', field.id);
    load();
  }

  async function deleteField(id: string) {
    if (!confirm('Supprimer ce domaine ?')) return;
    await supabase.from('study_fields').delete().eq('id', id);
    load();
  }

  if (authLoading || loading) return <LoadingSpinner />;
  if (!isEditor) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSubHeader title="Catégories & Domaines" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Categories */}
        <div>
          <h2 className="font-bold text-lg text-[#080808] mb-4">Catégories d'opportunités</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3">
            <div className="flex gap-2">
              <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Nouvelle catégorie..." className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" />
              <button onClick={addCategory} className="px-4 py-2 bg-[#FFD400] text-[#080808] font-bold text-sm rounded-lg hover:bg-yellow-300 inline-flex items-center gap-1"><Plus className="w-4 h-4" /> Ajouter</button>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-3">
                <div>
                  <p className="font-medium text-sm text-[#080808]">{cat.name}</p>
                  <p className="text-xs text-gray-400">{cat.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cat.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {cat.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button onClick={() => toggleCategoryActive(cat)} className="p-1.5 text-gray-400 hover:text-[#FFD400]"><Check className="w-4 h-4" /></button>
                  <button onClick={() => deleteCategory(cat.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Study fields */}
        <div>
          <h2 className="font-bold text-lg text-[#080808] mb-4">Domaines d'études</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3">
            <div className="flex gap-2">
              <input value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} placeholder="Nouveau domaine..." className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" />
              <button onClick={addField} className="px-4 py-2 bg-[#FFD400] text-[#080808] font-bold text-sm rounded-lg hover:bg-yellow-300 inline-flex items-center gap-1"><Plus className="w-4 h-4" /> Ajouter</button>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {studyFields.map((field) => (
              <div key={field.id} className="flex items-center justify-between p-3">
                <div>
                  <p className="font-medium text-sm text-[#080808]">{field.name}</p>
                  <p className="text-xs text-gray-400">{field.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${field.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {field.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button onClick={() => toggleFieldActive(field)} className="p-1.5 text-gray-400 hover:text-[#FFD400]"><Check className="w-4 h-4" /></button>
                  <button onClick={() => deleteField(field.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// USERS ADMIN
// ============================================================

export function AdminUsersPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const { navigate } = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setProfiles((data as Profile[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate('/');
  }, [authLoading, isAdmin, navigate]);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  async function changeRole(id: string, role: string) {
    await supabase.from('profiles').update({ role }).eq('id', id);
    load();
  }

  if (authLoading || loading) return <LoadingSpinner />;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSubHeader title="Utilisateurs" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {profiles.length === 0 ? (
          <EmptyState title="Aucun utilisateur" message="Les utilisateurs apparaîtront ici après inscription." />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Nom</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Rôle</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden lg:table-cell">Inscrit le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {profiles.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-[#080808]">{p.display_name}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{p.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={p.role}
                        onChange={(e) => changeRole(p.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-[#FFD400] bg-white"
                      >
                        <option value="user">Utilisateur</option>
                        <option value="editor">Éditeur</option>
                        <option value="admin">Administrateur</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{formatDate(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-gray-400 mt-4">
          Les rôles administratifs sont protégés côté serveur. Un utilisateur ne peut pas s'auto-attribuer un rôle élevé.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// REPORTS ADMIN
// ============================================================

const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  ouvert: 'Ouvert',
  en_cours: 'En cours',
  resolu: 'Résolu',
  ferme: 'Fermé',
};

export function AdminReportsPage() {
  const { isEditor, loading: authLoading } = useAuth();
  const { navigate } = useRouter();
  const [reports, setReports] = useState<(Report & { opportunity?: { title: string; slug: string } | null })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('reports')
      .select('*, opportunity:opportunities(title, slug)')
      .order('created_at', { ascending: false });
    setReports((data as (Report & { opportunity?: { title: string; slug: string } | null })[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !isEditor) navigate('/');
  }, [authLoading, isEditor, navigate]);

  useEffect(() => { if (isEditor) load(); }, [isEditor, load]);

  async function updateStatus(id: string, status: ReportStatus) {
    await supabase.from('reports').update({ status }).eq('id', id);
    load();
  }

  if (authLoading || loading) return <LoadingSpinner />;
  if (!isEditor) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSubHeader title="Signalements" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {reports.length === 0 ? (
          <EmptyState title="Aucun signalement" message="Les signalements d'erreur apparaîtront ici." />
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Flag className="w-4 h-4 text-orange-500" />
                      <span className="font-semibold text-sm text-[#080808]">{report.reason}</span>
                    </div>
                    {report.opportunity && (
                      <Link to={`/opportunite/${report.opportunity.slug}`} className="text-xs text-gray-500 hover:text-[#FFD400]">
                        {report.opportunity.title}
                      </Link>
                    )}
                    {report.details && <p className="text-sm text-gray-600 mt-1">{report.details}</p>}
                    <p className="text-xs text-gray-400 mt-1">{formatDate(report.created_at)}</p>
                  </div>
                  <select
                    value={report.status}
                    onChange={(e) => updateStatus(report.id, e.target.value as ReportStatus)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-[#FFD400] bg-white flex-shrink-0"
                  >
                    {Object.entries(REPORT_STATUS_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
