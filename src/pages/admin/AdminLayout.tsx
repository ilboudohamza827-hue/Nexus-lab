import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter, Link } from '@/lib/router';
import { supabase } from '@/lib/supabase';
import type { Opportunity, OpportunityStatus } from '@/lib/types';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/types';
import { LoadingSpinner, EmptyState } from '@/components/UI';
import {
  Shield, LayoutDashboard, BookOpen, Video as VideoIcon, FolderTree,
  Users, Flag, Plus, Search, Edit, Archive, CheckCircle, Eye, Trash2, X,
  Calendar, Rocket, Image as ImageIcon
} from 'lucide-react';
import { formatDate, isExpired, slugify } from '@/lib/utils';

export function AdminDashboardPage() {
  const { isEditor, loading: authLoading } = useAuth();
  const { navigate } = useRouter();
  const [stats, setStats] = useState({ published: 0, toVerify: 0, expired: 0, reports: 0, videos: 0, users: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isEditor) navigate('/');
  }, [authLoading, isEditor, navigate]);

  useEffect(() => {
    async function loadStats() {
      const [pub, verify, exp, rep, vid, usr] = await Promise.all([
        supabase.from('opportunities').select('id', { count: 'exact' }).eq('status', 'publiee'),
        supabase.from('opportunities').select('id', { count: 'exact' }).in('status', ['a_verifier', 'verification_necessaire']),
        supabase.from('opportunities').select('id', { count: 'exact' }).in('status', ['expiree', 'archivee']),
        supabase.from('reports').select('id', { count: 'exact' }).eq('status', 'ouvert'),
        supabase.from('videos').select('id', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }),
      ]);
      setStats({
        published: pub.count ?? 0,
        toVerify: verify.count ?? 0,
        expired: exp.count ?? 0,
        reports: rep.count ?? 0,
        videos: vid.count ?? 0,
        users: usr.count ?? 0,
      });
      setLoading(false);
    }
    if (isEditor) loadStats();
  }, [isEditor]);

  if (authLoading || loading) return <LoadingSpinner />;
  if (!isEditor) return null;

  const statCards = [
    { label: 'Opportunités publiées', value: stats.published, icon: BookOpen, color: 'text-green-600' },
    { label: 'À vérifier', value: stats.toVerify, icon: CheckCircle, color: 'text-yellow-600' },
    { label: 'Expirées / Archivées', value: stats.expired, icon: Archive, color: 'text-red-500' },
    { label: 'Signalements ouverts', value: stats.reports, icon: Flag, color: 'text-orange-500' },
    { label: 'Vidéos', value: stats.videos, icon: VideoIcon, color: 'text-blue-500' },
    { label: 'Utilisateurs', value: stats.users, icon: Users, color: 'text-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#080808] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#FFD400]" /> Administration
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {statCards.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <stat.icon className={`w-7 h-7 ${stat.color} mb-2`} />
              <p className="text-2xl font-extrabold text-[#080808]">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AdminLink to="/admin/opportunites" icon={BookOpen} label="Gérer les opportunités" desc="Créer, modifier, publier" />
          <AdminLink to="/admin/videos" icon={VideoIcon} label="Gérer les vidéos" desc="Ajouter, associer, publier" />
          <AdminLink to="/admin/categories" icon={FolderTree} label="Catégories & domaines" desc="Gérer les taxonomies" />
          <AdminLink to="/admin/utilisateurs" icon={Users} label="Utilisateurs" desc="Rôles et permissions" />
          <AdminLink to="/admin/signalements" icon={Flag} label="Signalements" desc="Traiter les erreurs signalées" />
        </div>

        <h2 className="font-bold text-lg text-[#080808] mt-10 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-[#FFD400] rounded-full" /> NexusLab Hub
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AdminLink to="/admin/hub-activites" icon={Calendar} label="Activités" desc="Créer et gérer" />
          <AdminLink to="/admin/hub-clubs" icon={Users} label="Clubs" desc="Modération" />
          <AdminLink to="/admin/hub-projets" icon={Rocket} label="Projets" desc="Modération" />
          <AdminLink to="/admin/hub-galerie" icon={ImageIcon} label="Galerie" desc="Réalisations" />
        </div>
      </div>
    </div>
  );
}

function AdminLink({ to, icon: Icon, label, desc }: { to: string; icon: typeof Shield; label: string; desc: string }) {
  return (
    <Link to={to} className="bg-white rounded-xl border border-gray-200 p-5 nx-card flex items-center gap-4">
      <div className="w-12 h-12 bg-[#080808] rounded-xl flex items-center justify-center">
        <Icon className="w-6 h-6 text-[#FFD400]" />
      </div>
      <div>
        <p className="font-bold text-[#080808]">{label}</p>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
    </Link>
  );
}

export function AdminOpportunitiesPage() {
  const { isEditor, loading: authLoading } = useAuth();
  const { navigate } = useRouter();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const load = useCallback(async () => {
    let query = supabase.from('opportunities').select('*, category:categories(*)').order('created_at', { ascending: false });
    if (statusFilter) query = query.eq('status', statusFilter);
    const { data } = await query;
    setOpportunities((data as unknown as Opportunity[]) ?? []);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    if (!authLoading && !isEditor) navigate('/');
  }, [authLoading, isEditor, navigate]);

  useEffect(() => {
    if (isEditor) load();
  }, [isEditor, load]);

  const filtered = search
    ? opportunities.filter((o) => o.title.toLowerCase().includes(search.toLowerCase()))
    : opportunities;

  if (authLoading || loading) return <LoadingSpinner />;
  if (!isEditor) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSubHeader title="Gestion des opportunités" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-4 py-2.5">
            <Search className="w-5 h-5 text-gray-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="flex-1 outline-none text-sm" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none">
            <option value="">Tous les statuts</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <Link to="/admin/opportunite/new" className="px-5 py-2.5 bg-[#FFD400] text-[#080808] font-bold text-sm rounded-xl hover:bg-yellow-300 transition-colors inline-flex items-center gap-2 whitespace-nowrap">
            <Plus className="w-4 h-4" /> Nouvelle
          </Link>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="Aucune opportunité" message="Clique sur « Nouvelle » pour créer ta première annonce." actionLabel="Créer" onAction={() => navigate('/admin/opportunite/new')} />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Titre</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">Catégorie</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden lg:table-cell">Date limite</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Statut</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((opp) => (
                  <tr key={opp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#080808] line-clamp-1">{opp.title}</p>
                      {opp.organization && <p className="text-xs text-gray-500">{opp.organization}</p>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-500">{opp.category?.name ?? '—'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-500">{opp.deadline ? formatDate(opp.deadline) : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[opp.status]}`}>
                        {STATUS_LABELS[opp.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/opportunite/${opp.slug}`} className="p-1.5 text-gray-500 hover:text-[#080808]" title="Voir">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link to={`/admin/opportunite/${opp.id}`} className="p-1.5 text-gray-500 hover:text-[#FFD400]" title="Modifier">
                          <Edit className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminSubHeader({ title }: { title: string }) {
  return (
    <div className="bg-[#080808] text-white py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-sm">
        <Link to="/admin" className="text-gray-500 hover:text-[#FFD400]">Admin</Link>
        <span className="text-gray-500">/</span>
        <span className="text-white font-medium">{title}</span>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2">
        <h1 className="text-xl md:text-2xl font-bold">{title}</h1>
      </div>
    </div>
  );
}
