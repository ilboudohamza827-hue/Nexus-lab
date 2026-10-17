import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link, useRouter } from '@/lib/router';
import { useAuth } from '@/lib/auth';
import type { HubActivity, HubClub, HubProject, HubGalleryItem, HubClubCategory } from '@/lib/types';
import { ACTIVITY_STATUS_LABELS, ACTIVITY_STATUS_COLORS, CLUB_STATUS_LABELS, PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS, GALLERY_TYPE_LABELS } from '@/lib/types';
import { LoadingSpinner, EmptyState, Badge } from '@/components/UI';
import { formatDate, formatDateTime, slugify } from '@/lib/utils';
import {
  Users, Calendar, FolderKanban, Image as ImageIcon, ArrowRight, Sparkles,
  MapPin, Clock, Target, Lightbulb, Rocket, Heart, Plus, Search, Compass,
  Zap, Trophy, Palette, Code, Microscope, Leaf, Megaphone, BookOpen, Camera
} from 'lucide-react';

// Community hero image
const HERO_IMG = 'https://images.pexels.com/photos/34526425/pexels-photo-34526425.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
const COLLAB_IMG = 'https://images.pexels.com/photos/9433170/pexels-photo-9433170.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
const WORKSHOP_IMG = 'https://images.pexels.com/photos/6146973/pexels-photo-6146973.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

// ============================================================
// HUB LANDING PAGE
// ============================================================

export function HubHomePage() {
  const [activities, setActivities] = useState<HubActivity[]>([]);
  const [clubs, setClubs] = useState<HubClub[]>([]);
  const [projects, setProjects] = useState<HubProject[]>([]);
  const [galleryItems, setGalleryItems] = useState<HubGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [actRes, clubRes, projRes, galRes] = await Promise.all([
        supabase.from('hub_activities').select('*').in('status', ['publie', 'complet']).order('activity_date', { ascending: true }).limit(4),
        supabase.from('hub_clubs').select('*, category:hub_club_categories(*)').eq('status', 'actif').order('created_at', { ascending: false }).limit(4),
        supabase.from('hub_projects').select('*').eq('moderation_status', 'approuve').order('created_at', { ascending: false }).limit(4),
        supabase.from('hub_gallery_items').select('*').eq('status', 'publie').order('created_at', { ascending: false }).limit(6),
      ]);
      setActivities(actRes.data as HubActivity[] ?? []);
      setClubs(clubRes.data as HubClub[] ?? []);
      setProjects(projRes.data as HubProject[] ?? []);
      setGalleryItems(galRes.data as HubGalleryItem[] ?? []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner message="Chargement du Hub..." />;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#080808] text-white">
        <div className="absolute inset-0 opacity-20">
          <img src={HERO_IMG} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/80 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FFD400]/10 border border-[#FFD400]/30 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-[#FFD400]" />
              <span className="text-sm text-[#FFD400] font-medium">Communauté NexusLab</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
              Découvre, rencontre, apprends<br />et <span className="text-[#FFD400]">crée ensemble</span>.
            </h1>
            <p className="text-lg text-gray-300 mb-8">
              Rejoins une communauté de jeunes qui partagent tes passions. Participe à des activités,
              rejoins des clubs, crée des projets et montre ce que vous êtes capables de construire ensemble.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/hub/activites" className="px-6 py-3 bg-[#FFD400] text-[#080808] font-bold rounded-xl hover:bg-yellow-300 transition-colors inline-flex items-center justify-center gap-2">
                <Calendar className="w-5 h-5" /> Voir les activités
              </Link>
              <Link to="/hub/projets" className="px-6 py-3 border-2 border-white/20 text-white font-bold rounded-xl hover:bg-white/5 transition-colors inline-flex items-center justify-center gap-2">
                <Rocket className="w-5 h-5" /> Découvrir les projets
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick access tiles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <HubTile to="/hub/activites" icon={Calendar} label="Activités" desc="Ateliers, sorties, rencontres" />
          <HubTile to="/hub/clubs" icon={Users} label="Clubs" desc="Communautés de passionnés" />
          <HubTile to="/hub/projets" icon={FolderKanban} label="Projets" desc="Collaborer et créer" />
          <HubTile to="/hub/realisations" icon={Trophy} label="Réalisations" desc="Vitrine des talents" />
        </div>
      </section>

      {/* Upcoming activities */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SectionHeader title="Prochaines activités" to="/hub/activites" />
        {activities.length === 0 ? (
          <EmptyHub message="Les activités seront publiées prochainement." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {activities.map((act) => (
              <Link key={act.id} to={`/hub/activites/${act.slug}`} className="bg-white rounded-xl border border-gray-200 overflow-hidden nx-card">
                {act.image_url ? (
                  <img src={act.image_url} alt={act.title} className="w-full h-32 object-cover" />
                ) : (
                  <div className="w-full h-32 bg-[#080808] flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-[#FFD400]" />
                  </div>
                )}
                <div className="p-4">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${ACTIVITY_STATUS_COLORS[act.status]}`}>
                    {ACTIVITY_STATUS_LABELS[act.status]}
                  </span>
                  <h3 className="font-bold text-sm text-[#080808] line-clamp-2 mb-2">{act.title}</h3>
                  {act.activity_date && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDateTime(act.activity_date)}
                    </p>
                  )}
                  {act.location && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {act.location}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Clubs */}
      <section className="bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader title="Clubs et communautés" to="/hub/clubs" />
          {clubs.length === 0 ? (
            <EmptyHub message="Les clubs seront créés prochainement. Tu pourras en proposer un !" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {clubs.map((club) => (
                <Link key={club.id} to={`/hub/clubs/${club.slug}`} className="bg-white rounded-xl border border-gray-200 p-5 nx-card">
                  <div className="w-12 h-12 bg-[#080808] rounded-xl flex items-center justify-center mb-3">
                    <Users className="w-6 h-6 text-[#FFD400]" />
                  </div>
                  <h3 className="font-bold text-sm text-[#080808] line-clamp-1 mb-1">{club.name}</h3>
                  {club.category && <p className="text-xs text-gray-400 mb-2">{club.category.name}</p>}
                  {club.description && <p className="text-xs text-gray-500 line-clamp-2">{club.description}</p>}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Projects */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <SectionHeader title="Projets collaboratifs" to="/hub/projets" />
        {projects.length === 0 ? (
          <EmptyHub message="Aucun projet publié pour le moment. Propose le tien !" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {projects.map((proj) => (
              <Link key={proj.id} to={`/hub/projets/${proj.slug}`} className="bg-white rounded-xl border border-gray-200 p-5 nx-card">
                <div className="w-12 h-12 bg-[#FFD400] rounded-xl flex items-center justify-center mb-3">
                  <Rocket className="w-6 h-6 text-[#080808]" />
                </div>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${PROJECT_STATUS_COLORS[proj.status]}`}>
                  {PROJECT_STATUS_LABELS[proj.status]}
                </span>
                <h3 className="font-bold text-sm text-[#080808] line-clamp-2 mb-1">{proj.name}</h3>
                {proj.description && <p className="text-xs text-gray-500 line-clamp-2">{proj.description}</p>}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Gallery */}
      <section className="bg-[#080808] text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#FFD400]" /> Réalisations de la communauté
            </h2>
            <Link to="/hub/realisations" className="text-sm font-semibold text-[#FFD400] hover:text-yellow-300 inline-flex items-center gap-1">
              Tout voir <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {galleryItems.length === 0 ? (
            <div className="text-center py-10">
              <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Les réalisations seront publiées prochainement.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {galleryItems.map((item) => (
                <Link key={item.id} to="/hub/realisations" className="group relative aspect-square rounded-xl overflow-hidden bg-white/5">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <p className="text-xs font-medium text-white line-clamp-2">{item.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Call to action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-[#FFD400] rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#080808] mb-3">
            Tu as une idée ? Un projet ? Une passion ?
          </h2>
          <p className="text-[#080808]/80 mb-6 max-w-xl mx-auto">
            Tu n'as pas besoin d'être expert pour participer. Chacun trouve sa place,
            apprend, contribue et progresse avec les autres.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/hub/projets" className="px-6 py-3 bg-[#080808] text-white font-bold rounded-xl hover:bg-[#121212] transition-colors inline-flex items-center justify-center gap-2">
              <Rocket className="w-5 h-5" /> Proposer un projet
            </Link>
            <Link to="/hub/clubs" className="px-6 py-3 border-2 border-[#080808] text-[#080808] font-bold rounded-xl hover:bg-[#080808] hover:text-white transition-colors inline-flex items-center justify-center gap-2">
              <Users className="w-5 h-5" /> Rejoindre un club
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// ============================================================
// HUB ACTIVITIES LISTING
// ============================================================

export function HubActivitiesPage() {
  const [activities, setActivities] = useState<HubActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    async function load() {
      let query = supabase.from('hub_activities').select('*').in('status', ['publie', 'complet', 'termine']).order('activity_date', { ascending: true });
      if (statusFilter) query = query.eq('status', statusFilter);
      const { data } = await query;
      setActivities(data as HubActivity[] ?? []);
      setLoading(false);
    }
    load();
  }, [statusFilter]);

  const filtered = search ? activities.filter((a) => a.title.toLowerCase().includes(search.toLowerCase())) : activities;

  return (
    <HubPageWrapper title="Activités et événements" subtitle="Ateliers, sorties, rencontres, challenges et plus encore.">
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-4 py-2.5">
          <Search className="w-5 h-5 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une activité..." className="flex-1 outline-none text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none">
          <option value="">Tous les statuts</option>
          <option value="publie">Publié</option>
          <option value="complet">Complet</option>
          <option value="termine">Terminé</option>
        </select>
      </div>
      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState title="Aucune activité" message="Les activités seront publiées prochainement. Reviens vite !" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((act) => (
            <Link key={act.id} to={`/hub/activites/${act.slug}`} className="bg-white rounded-xl border border-gray-200 overflow-hidden nx-card flex flex-col">
              {act.image_url ? (
                <img src={act.image_url} alt={act.title} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-[#080808] flex items-center justify-center">
                  <Calendar className="w-10 h-10 text-[#FFD400]" />
                </div>
              )}
              <div className="p-5 flex-1">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${ACTIVITY_STATUS_COLORS[act.status]}`}>
                  {ACTIVITY_STATUS_LABELS[act.status]}
                </span>
                <h3 className="font-bold text-[#080808] line-clamp-2 mb-2">{act.title}</h3>
                {act.description && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{act.description}</p>}
                <div className="space-y-1 text-xs text-gray-500">
                  {act.activity_date && <p className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDateTime(act.activity_date)}</p>}
                  {act.location && <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {act.location}</p>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </HubPageWrapper>
  );
}

// ============================================================
// HUB CLUBS LISTING
// ============================================================

export function HubClubsPage() {
  const [clubs, setClubs] = useState<HubClub[]>([]);
  const [categories, setCategories] = useState<HubClubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');

  useEffect(() => {
    async function load() {
      const [clubRes, catRes] = await Promise.all([
        supabase.from('hub_clubs').select('*, category:hub_club_categories(*)').eq('status', 'actif').order('name'),
        supabase.from('hub_club_categories').select('*').eq('is_active', true).order('sort_order'),
      ]);
      setClubs(clubRes.data as HubClub[] ?? []);
      setCategories(catRes.data as HubClubCategory[] ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = clubs.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (catFilter && c.category_id !== catFilter) return false;
    return true;
  });

  return (
    <HubPageWrapper title="Clubs et communautés" subtitle="Rejoins des groupes organisés autour de tes centres d'intérêt.">
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-4 py-2.5">
          <Search className="w-5 h-5 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un club..." className="flex-1 outline-none text-sm" />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none">
          <option value="">Toutes les catégories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState title="Aucun club trouvé" message="Aucun club ne correspond à ta recherche. Tu peux en proposer un !" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((club) => (
            <Link key={club.id} to={`/hub/clubs/${club.slug}`} className="bg-white rounded-xl border border-gray-200 p-5 nx-card">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-[#080808] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-[#FFD400]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#080808] line-clamp-1">{club.name}</h3>
                  {club.category && <p className="text-xs text-gray-400">{club.category.name}</p>}
                </div>
              </div>
              {club.description && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{club.description}</p>}
              {club.skills_developed && (
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-[#FFD400]" /> {club.skills_developed}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </HubPageWrapper>
  );
}

// ============================================================
// HUB PROJECTS LISTING
// ============================================================

export function HubProjectsPage() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [projects, setProjects] = useState<HubProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ name: '', description: '', problem_statement: '', objectives: '', skills_needed: '', roles_available: '' });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    let query = supabase.from('hub_projects').select('*').eq('moderation_status', 'approuve').order('created_at', { ascending: false });
    if (statusFilter) query = query.eq('status', statusFilter);
    const { data } = await query;
    setProjects(data as HubProject[] ?? []);
    setLoading(false);
  }

  const filtered = search ? projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())) : projects;

  async function submitProject() {
    if (!user || !form.name.trim()) return;
    setSaving(true);
    const slug = slugify(form.name);
    const { error } = await supabase.from('hub_projects').insert({
      name: form.name.trim(),
      slug,
      description: form.description || null,
      problem_statement: form.problem_statement || null,
      objectives: form.objectives || null,
      skills_needed: form.skills_needed.split(',').map((s) => s.trim()).filter(Boolean),
      roles_available: form.roles_available.split(',').map((s) => s.trim()).filter(Boolean),
      status: 'idee',
      moderation_status: 'en_attente',
      created_by: user.id,
    });
    setSaving(false);
    if (!error) {
      setShowForm(false);
      setForm({ name: '', description: '', problem_statement: '', objectives: '', skills_needed: '', roles_available: '' });
      alert('Projet soumis ! Il sera visible après validation par un administrateur.');
    }
  }

  return (
    <HubPageWrapper title="Projets collaboratifs" subtitle="Passe de l'idée à l'action. Rejoins une équipe ou propose ton projet.">
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-4 py-2.5">
          <Search className="w-5 h-5 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un projet..." className="flex-1 outline-none text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); }} className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none">
          <option value="">Tous les statuts</option>
          {Object.entries(PROJECT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {user && (
          <button onClick={() => setShowForm(!showForm)} className="px-5 py-2.5 bg-[#FFD400] text-[#080808] font-bold text-sm rounded-xl hover:bg-yellow-300 inline-flex items-center gap-2 whitespace-nowrap">
            <Plus className="w-4 h-4" /> Proposer
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4">
          <h3 className="font-bold text-[#080808]">Proposer un projet</h3>
          <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Nom du projet *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" /></div>
          <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400] resize-none" /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Problème ou besoin</label><textarea value={form.problem_statement} onChange={(e) => setForm({ ...form, problem_statement: e.target.value })} rows={2} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400] resize-none" /></div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Objectifs</label><textarea value={form.objectives} onChange={(e) => setForm({ ...form, objectives: e.target.value })} rows={2} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400] resize-none" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Compétences recherchées (virgules)</label><input value={form.skills_needed} onChange={(e) => setForm({ ...form, skills_needed: e.target.value })} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" placeholder="Design, Programmation, ..." /></div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Rôles disponibles (virgules)</label><input value={form.roles_available} onChange={(e) => setForm({ ...form, roles_available: e.target.value })} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FFD400]" placeholder="Développeur, Designer, ..." /></div>
          </div>
          <p className="text-xs text-gray-400">Ton projet sera soumis à validation avant publication publique.</p>
          <button onClick={submitProject} disabled={saving || !form.name.trim()} className="px-5 py-2.5 bg-[#080808] text-white font-bold text-sm rounded-xl hover:bg-[#121212] disabled:opacity-50">
            {saving ? 'Envoi...' : 'Soumettre le projet'}
          </button>
        </div>
      )}

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState title="Aucun projet trouvé" message={user ? "Propose le premier projet de la communauté !" : "Connecte-toi pour proposer un projet."} actionLabel={user ? "Proposer" : "Se connecter"} onAction={() => user ? setShowForm(true) : navigate('/connexion')} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((proj) => (
            <Link key={proj.id} to={`/hub/projets/${proj.slug}`} className="bg-white rounded-xl border border-gray-200 p-5 nx-card">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-[#FFD400] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Rocket className="w-6 h-6 text-[#080808]" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-1 ${PROJECT_STATUS_COLORS[proj.status]}`}>
                    {PROJECT_STATUS_LABELS[proj.status]}
                  </span>
                  <h3 className="font-bold text-[#080808] line-clamp-1">{proj.name}</h3>
                </div>
              </div>
              {proj.description && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{proj.description}</p>}
              {proj.skills_needed.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {proj.skills_needed.slice(0, 3).map((s) => <Badge key={s}>{s}</Badge>)}
                  {proj.skills_needed.length > 3 && <Badge>+{proj.skills_needed.length - 3}</Badge>}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </HubPageWrapper>
  );
}

// ============================================================
// HUB GALLERY PAGE
// ============================================================

export function HubGalleryPage() {
  const [items, setItems] = useState<HubGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    async function load() {
      let query = supabase.from('hub_gallery_items').select('*').eq('status', 'publie').order('created_at', { ascending: false });
      if (typeFilter) query = query.eq('item_type', typeFilter);
      const { data } = await query;
      setItems(data as HubGalleryItem[] ?? []);
      setLoading(false);
    }
    load();
  }, [typeFilter]);

  return (
    <HubPageWrapper title="Vitrine des réalisations" subtitle="Découvre ce que la communauté a construit ensemble.">
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setTypeFilter('')} className={`px-4 py-2 rounded-lg text-sm font-medium ${!typeFilter ? 'bg-[#FFD400] text-[#080808]' : 'bg-white border border-gray-200 text-gray-700 hover:border-[#FFD400]'}`}>Toutes</button>
        {Object.entries(GALLERY_TYPE_LABELS).map(([k, v]) => (
          <button key={k} onClick={() => setTypeFilter(k)} className={`px-4 py-2 rounded-lg text-sm font-medium ${typeFilter === k ? 'bg-[#FFD400] text-[#080808]' : 'bg-white border border-gray-200 text-gray-700 hover:border-[#FFD400]'}`}>{v}</button>
        ))}
      </div>
      {loading ? <LoadingSpinner /> : items.length === 0 ? (
        <EmptyState title="Aucune réalisation publiée" message="Les réalisations de la communauté apparaîtront ici." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden nx-card">
              {item.image_url ? (
                <img src={item.image_url} alt={item.title} className="w-full h-48 object-cover" />
              ) : (
                <div className="w-full h-48 bg-[#080808] flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-[#FFD400]" />
                </div>
              )}
              <div className="p-5">
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-[#080808] text-[#FFD400] mb-2">{GALLERY_TYPE_LABELS[item.item_type]}</span>
                <h3 className="font-bold text-[#080808] mb-1">{item.title}</h3>
                {item.description && <p className="text-sm text-gray-500 line-clamp-2 mb-2">{item.description}</p>}
                {item.contributor_names.length > 0 && (
                  <p className="text-xs text-gray-400">Par: {item.contributor_names.join(', ')}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">{formatDate(item.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </HubPageWrapper>
  );
}

// ============================================================
// SHARED COMPONENTS
// ============================================================

function HubTile({ to, icon: Icon, label, desc }: { to: string; icon: typeof Users; label: string; desc: string }) {
  return (
    <Link to={to} className="bg-white rounded-xl border border-gray-200 p-4 nx-card flex items-center gap-3">
      <div className="w-12 h-12 bg-[#080808] rounded-xl flex items-center justify-center flex-shrink-0">
        <Icon className="w-6 h-6 text-[#FFD400]" />
      </div>
      <div>
        <p className="font-bold text-sm text-[#080808]">{label}</p>
        <p className="text-xs text-gray-400">{desc}</p>
      </div>
    </Link>
  );
}

function SectionHeader({ title, to }: { title: string; to: string }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-xl font-bold text-[#080808]">{title}</h2>
      <Link to={to} className="text-sm font-semibold text-[#080808] hover:text-[#FFD400] inline-flex items-center gap-1">
        Tout voir <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

function EmptyHub({ message }: { message: string }) {
  return (
    <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200">
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

function HubPageWrapper({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#080808] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm mb-2">
            <Link to="/hub" className="text-gray-400 hover:text-[#FFD400]">Hub</Link>
            <span className="text-gray-600">/</span>
            <span className="text-white">{title}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">{title}</h1>
          <p className="text-gray-400 text-sm">{subtitle}</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}
