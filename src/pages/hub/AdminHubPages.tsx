import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter, Link } from '@/lib/router';
import { supabase } from '@/lib/supabase';
import type { HubActivity, ActivityStatus, HubClub, ClubStatus, HubProject, ModerationStatus, HubGalleryItem, GalleryItemStatus, HubClubCategory, HubActivityRegistration } from '@/lib/types';
import { ACTIVITY_STATUS_LABELS, ACTIVITY_STATUS_COLORS, CLUB_STATUS_LABELS, PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS, GALLERY_TYPE_LABELS } from '@/lib/types';
import { LoadingSpinner, EmptyState, Badge } from '@/components/UI';
import { AdminSubHeader } from '@/pages/admin/AdminLayout';
import { slugify, formatDate, formatDateTime, extractYouTubeId } from '@/lib/utils';
import { Plus, Edit, Trash2, Save, Check, X, AlertCircle, Calendar, Users, Rocket, Image as ImageIcon, Flag, Eye } from 'lucide-react';

// ============================================================
// ADMIN: HUB ACTIVITIES
// ============================================================

export function AdminHubActivitiesPage() {
  const { isEditor, loading: authLoading, user } = useAuth();
  const { navigate } = useRouter();
  const [activities, setActivities] = useState<HubActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emptyForm = { title: '', description: '', image_url: '', objectives: '', activity_date: '', end_date: '', location: '', is_online: false, online_link: '', target_audience: '', prerequisites: '', max_participants: '', registration_deadline: '', fees: '', organizer: '', status: 'brouillon' as ActivityStatus };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    const { data } = await supabase.from('hub_activities').select('*').order('created_at', { ascending: false });
    setActivities(data as HubActivity[] ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !isEditor) navigate('/');
  }, [authLoading, isEditor, navigate]);
  useEffect(() => { if (isEditor) load(); }, [isEditor, load]);

  function resetForm() { setForm(emptyForm); setEditId(null); setShowForm(false); setError(null); }

  async function handleSave() {
    if (!form.title.trim()) { setError('Le titre est obligatoire.'); return; }
    setSaving(true); setError(null);
    const slug = slugify(form.title);
    const payload = {
      title: form.title.trim(), slug, description: form.description || null, image_url: form.image_url || null,
      objectives: form.objectives || null, activity_date: form.activity_date || null, end_date: form.end_date || null,
      location: form.location || null, is_online: form.is_online, online_link: form.online_link || null,
      target_audience: form.target_audience || null, prerequisites: form.prerequisites || null,
      max_participants: form.max_participants ? parseInt(form.max_participants) : null,
      registration_deadline: form.registration_deadline || null, fees: form.fees || null,
      organizer: form.organizer || null, status: form.status, created_by: user?.id,
    };
    if (editId) {
      await supabase.from('hub_activities').update(payload).eq('id', editId);
    } else {
      await supabase.from('hub_activities').insert(payload);
    }
    setSaving(false); resetForm(); load();
  }

  function startEdit(act: HubActivity) {
    setEditId(act.id);
    setForm({
      title: act.title, description: act.description ?? '', image_url: act.image_url ?? '', objectives: act.objectives ?? '',
      activity_date: act.activity_date ? new Date(act.activity_date).toISOString().slice(0, 16) : '',
      end_date: act.end_date ? new Date(act.end_date).toISOString().slice(0, 16) : '',
      location: act.location ?? '', is_online: act.is_online, online_link: act.online_link ?? '',
      target_audience: act.target_audience ?? '', prerequisites: act.prerequisites ?? '',
      max_participants: act.max_participants?.toString() ?? '', registration_deadline: act.registration_deadline ? new Date(act.registration_deadline).toISOString().slice(0, 16) : '',
      fees: act.fees ?? '', organizer: act.organizer ?? '', status: act.status,
    });
    setShowForm(true);
  }

  async function deleteActivity(id: string) {
    if (!confirm('Supprimer cette activité ?')) return;
    await supabase.from('hub_activities').delete().eq('id', id);
    load();
  }

  if (authLoading || loading) return <LoadingSpinner />;
  if (!isEditor) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSubHeader title="Hub — Activités" />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="mb-4 px-5 py-2.5 bg-[#FFD400] text-[#080808] font-bold text-sm rounded-xl hover:bg-yellow-300 inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> {showForm ? 'Annuler' : 'Nouvelle activité'}
        </button>

        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4">
            {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
            <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Titre *</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" /></div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400] resize-none" /></div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Image URL</label><input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" placeholder="https://..." /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Date et heure</label><input type="datetime-local" value={form.activity_date} onChange={(e) => setForm({ ...form, activity_date: e.target.value })} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" /></div>
              <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Lieu</label><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Organisateur</label><input value={form.organizer} onChange={(e) => setForm({ ...form, organizer: e.target.value })} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" /></div>
              <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Places max</label><input type="number" value={form.max_participants} onChange={(e) => setForm({ ...form, max_participants: e.target.value })} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" /></div>
            </div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Public cible</label><input value={form.target_audience} onChange={(e) => setForm({ ...form, target_audience: e.target.value })} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_online" checked={form.is_online} onChange={(e) => setForm({ ...form, is_online: e.target.checked })} className="w-4 h-4" />
              <label htmlFor="is_online" className="text-sm text-gray-700">Activité en ligne</label>
            </div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Frais</label><input value={form.fees} onChange={(e) => setForm({ ...form, fees: e.target.value })} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" placeholder="Gratuit, ou montant" /></div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Statut</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ActivityStatus })} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]">{Object.entries(ACTIVITY_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 bg-[#080808] text-white font-bold text-sm rounded-xl inline-flex items-center gap-2 disabled:opacity-50"><Save className="w-4 h-4" /> {saving ? '...' : editId ? 'Modifier' : 'Créer'}</button>
          </div>
        )}

        {activities.length === 0 ? <EmptyState title="Aucune activité" message="Crée ta première activité." /> : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {activities.map((act) => (
              <div key={act.id} className="flex items-center justify-between p-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-[#080808] line-clamp-1">{act.title}</p>
                  <p className="text-xs text-gray-400">{act.activity_date ? formatDateTime(act.activity_date) : 'Pas de date'} • {act.location ?? 'Lieu non défini'}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTIVITY_STATUS_COLORS[act.status]}`}>{ACTIVITY_STATUS_LABELS[act.status]}</span>
                  <button onClick={() => startEdit(act)} className="p-1.5 text-gray-400 hover:text-[#FFD400]"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => deleteActivity(act.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
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
// ADMIN: HUB CLUBS (moderation)
// ============================================================

export function AdminHubClubsPage() {
  const { isEditor, loading: authLoading } = useAuth();
  const { navigate } = useRouter();
  const [clubs, setClubs] = useState<HubClub[]>([]);
  const [joinRequests, setJoinRequests] = useState<{ id: string; club_id: string; user_id: string; message: string | null; status: string; created_at: string; club: { name: string } }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [clubRes, reqRes] = await Promise.all([
      supabase.from('hub_clubs').select('*, category:hub_club_categories(*)').order('created_at', { ascending: false }),
      supabase.from('hub_club_join_requests').select('*, club:hub_clubs(name)').eq('status', 'en_attente').order('created_at', { ascending: false }),
    ]);
    setClubs(clubRes.data as HubClub[] ?? []);
    setJoinRequests(reqRes.data as { id: string; club_id: string; user_id: string; message: string | null; status: string; created_at: string; club: { name: string } }[] ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !isEditor) navigate('/');
  }, [authLoading, isEditor, navigate]);
  useEffect(() => { if (isEditor) load(); }, [isEditor, load]);

  async function updateClubStatus(id: string, status: ClubStatus) {
    await supabase.from('hub_clubs').update({ status }).eq('id', id);
    load();
  }

  async function handleJoinRequest(reqId: string, approve: boolean) {
    const status = approve ? 'approuve' : 'refuse';
    await supabase.from('hub_club_join_requests').update({ status, reviewed_at: new Date().toISOString(), reviewed_by: null }).eq('id', reqId);
    if (approve) {
      // Add as member
      const req = joinRequests.find((r) => r.id === reqId);
      if (req) {
        await supabase.from('hub_club_members').insert({ club_id: req.club_id, user_id: req.user_id, role: 'membre' });
      }
    }
    load();
  }

  if (authLoading || loading) return <LoadingSpinner />;
  if (!isEditor) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSubHeader title="Hub — Clubs" />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Join requests */}
        {joinRequests.length > 0 && (
          <div>
            <h2 className="font-bold text-lg text-[#080808] mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-[#FFD400]" /> Demandes d'adhésion en attente</h2>
            <div className="space-y-2">
              {joinRequests.map((req) => (
                <div key={req.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-[#080808]">Demande pour « {req.club.name} »</p>
                    {req.message && <p className="text-xs text-gray-500 mt-1">"{req.message}"</p>}
                    <p className="text-xs text-gray-400 mt-1">{formatDate(req.created_at)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleJoinRequest(req.id, true)} className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-lg hover:bg-green-200">Approuver</button>
                    <button onClick={() => handleJoinRequest(req.id, false)} className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-lg hover:bg-red-200">Refuser</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clubs list */}
        <div>
          <h2 className="font-bold text-lg text-[#080808] mb-4">Tous les clubs</h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {clubs.map((club) => (
              <div key={club.id} className="flex items-center justify-between p-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-[#080808] line-clamp-1">{club.name}</p>
                  {club.category && <p className="text-xs text-gray-400">{club.category.name}</p>}
                </div>
                <select value={club.status} onChange={(e) => updateClubStatus(club.id, e.target.value as ClubStatus)} className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-[#FFD400] bg-white">
                  {Object.entries(CLUB_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ADMIN: HUB PROJECTS (moderation)
// ============================================================

export function AdminHubProjectsPage() {
  const { isEditor, loading: authLoading } = useAuth();
  const { navigate } = useRouter();
  const [projects, setProjects] = useState<HubProject[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.from('hub_projects').select('*').order('created_at', { ascending: false });
    setProjects(data as HubProject[] ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !isEditor) navigate('/');
  }, [authLoading, isEditor, navigate]);
  useEffect(() => { if (isEditor) load(); }, [isEditor, load]);

  async function updateModeration(id: string, status: ModerationStatus) {
    await supabase.from('hub_projects').update({ moderation_status: status }).eq('id', id);
    load();
  }

  async function deleteProject(id: string) {
    if (!confirm('Supprimer ce projet ?')) return;
    await supabase.from('hub_projects').delete().eq('id', id);
    load();
  }

  if (authLoading || loading) return <LoadingSpinner />;
  if (!isEditor) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSubHeader title="Hub — Projets" />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {projects.length === 0 ? <EmptyState title="Aucun projet" message="Les projets proposés apparaîtront ici." /> : projects.map((proj) => (
            <div key={proj.id} className="p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-[#080808] line-clamp-1">{proj.name}</p>
                  {proj.description && <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{proj.description}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PROJECT_STATUS_COLORS[proj.status]}`}>{PROJECT_STATUS_LABELS[proj.status]}</span>
                  <button onClick={() => deleteProject(proj.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Modération:</span>
                <select value={proj.moderation_status} onChange={(e) => updateModeration(proj.id, e.target.value as ModerationStatus)} className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-[#FFD400] bg-white">
                  <option value="en_attente">En attente</option>
                  <option value="approuve">Approuvé</option>
                  <option value="refuse">Refusé</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ADMIN: HUB GALLERY
// ============================================================

export function AdminHubGalleryPage() {
  const { isEditor, loading: authLoading, user } = useAuth();
  const { navigate } = useRouter();
  const [items, setItems] = useState<HubGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', image_url: '', item_type: 'projet' as HubGalleryItem['item_type'], contributor_names: '' });

  const load = useCallback(async () => {
    const { data } = await supabase.from('hub_gallery_items').select('*').order('created_at', { ascending: false });
    setItems(data as HubGalleryItem[] ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !isEditor) navigate('/');
  }, [authLoading, isEditor, navigate]);
  useEffect(() => { if (isEditor) load(); }, [isEditor, load]);

  async function handleSave() {
    if (!form.title.trim() || !user) return;
    setSaving(true);
    await supabase.from('hub_gallery_items').insert({
      title: form.title.trim(), description: form.description || null, image_url: form.image_url || null,
      item_type: form.item_type, contributor_names: form.contributor_names.split(',').map((s) => s.trim()).filter(Boolean),
      status: 'publie', created_by: user.id,
    });
    setSaving(false);
    setForm({ title: '', description: '', image_url: '', item_type: 'projet', contributor_names: '' });
    setShowForm(false);
    load();
  }

  async function updateStatus(id: string, status: GalleryItemStatus) {
    await supabase.from('hub_gallery_items').update({ status }).eq('id', id);
    load();
  }

  async function deleteItem(id: string) {
    if (!confirm('Supprimer cette réalisation ?')) return;
    await supabase.from('hub_gallery_items').delete().eq('id', id);
    load();
  }

  if (authLoading || loading) return <LoadingSpinner />;
  if (!isEditor) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSubHeader title="Hub — Galerie" />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button onClick={() => setShowForm(!showForm)} className="mb-4 px-5 py-2.5 bg-[#FFD400] text-[#080808] font-bold text-sm rounded-xl hover:bg-yellow-300 inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> {showForm ? 'Annuler' : 'Nouvelle réalisation'}
        </button>

        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4">
            <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Titre *</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" /></div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400] resize-none" /></div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Image URL</label><input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" placeholder="https://..." /></div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Type</label><select value={form.item_type} onChange={(e) => setForm({ ...form, item_type: e.target.value as HubGalleryItem['item_type'] })} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]">{Object.entries(GALLERY_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Contributeurs (séparés par des virgules)</label><input value={form.contributor_names} onChange={(e) => setForm({ ...form, contributor_names: e.target.value })} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" placeholder="Noms des membres de l'équipe" /></div>
            <button onClick={handleSave} disabled={saving || !form.title.trim()} className="px-5 py-2.5 bg-[#080808] text-white font-bold text-sm rounded-xl inline-flex items-center gap-2 disabled:opacity-50"><Save className="w-4 h-4" /> {saving ? '...' : 'Publier'}</button>
          </div>
        )}

        {items.length === 0 ? <EmptyState title="Aucune réalisation" message="Publie la première réalisation de la communauté." /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {item.image_url ? <img src={item.image_url} alt={item.title} className="w-full h-32 object-cover" /> : <div className="w-full h-32 bg-gray-100 flex items-center justify-center"><ImageIcon className="w-8 h-8 text-gray-400" /></div>}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500">{GALLERY_TYPE_LABELS[item.item_type]}</span>
                    <select value={item.status} onChange={(e) => updateStatus(item.id, e.target.value as GalleryItemStatus)} className="text-xs border border-gray-200 rounded px-1.5 py-0.5 outline-none bg-white">
                      <option value="brouillon">Brouillon</option>
                      <option value="publie">Publié</option>
                      <option value="archive">Archivé</option>
                    </select>
                  </div>
                  <p className="font-medium text-sm text-[#080808] line-clamp-1">{item.title}</p>
                  <button onClick={() => deleteItem(item.id)} className="text-xs text-gray-400 hover:text-red-500 mt-2 inline-flex items-center gap-1"><Trash2 className="w-3 h-3" /> Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
