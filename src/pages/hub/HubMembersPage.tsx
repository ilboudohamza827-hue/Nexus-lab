import { useEffect, useState } from 'react';
import { Search, Users, BookOpen, HandHelping, MessagesSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { HubMemberSkill, Profile } from '@/lib/types';
import { EmptyState, LoadingSpinner, Badge } from '@/components/UI';
import { Link } from '@/lib/router';

interface MemberCard { id: string; name: string; skills: HubMemberSkill[]; }

export function HubMembersPage() {
  const [members, setMembers] = useState<MemberCard[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [skillsResult, profilesResult] = await Promise.all([
        supabase.from('hub_member_skills').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, display_name'),
      ]);
      const profiles = (profilesResult.data as Pick<Profile, 'id' | 'display_name'>[]) ?? [];
      const skills = (skillsResult.data as HubMemberSkill[]) ?? [];
      const cards = profiles.map((profile) => ({ id: profile.id, name: profile.display_name || 'Membre NexusLab', skills: skills.filter((skill) => skill.user_id === profile.id) })).filter((member) => member.skills.length > 0);
      setMembers(cards);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = members.filter((member) => !search || member.name.toLowerCase().includes(search.toLowerCase()) || member.skills.some((skill) => skill.skill_name.toLowerCase().includes(search.toLowerCase())));

  return <div className="min-h-screen bg-gray-50"><div className="bg-[#080808] text-white py-9"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><Link to="/hub" className="text-xs text-gray-500 hover:text-[#FFD400]">Hub / Membres</Link><h1 className="text-2xl md:text-3xl font-extrabold mt-2">Membres et talents</h1><p className="text-sm text-gray-400 mt-2">Découvre les personnes qui souhaitent apprendre, partager ou collaborer.</p></div></div><main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-4 py-3 mb-6"><Search className="w-5 h-5 text-gray-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un membre ou une compétence..." className="flex-1 outline-none text-sm" /></div>{loading ? <LoadingSpinner /> : filtered.length === 0 ? <EmptyState title="Aucun profil à afficher" message="Les membres apparaîtront ici lorsqu'ils auront partagé leurs centres d'intérêt." /> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{filtered.map((member) => <article key={member.id} className="bg-white rounded-2xl border border-gray-200 p-5 nx-card"><div className="flex items-center gap-3 mb-4"><div className="w-11 h-11 rounded-full bg-[#FFD400] flex items-center justify-center"><Users className="w-5 h-5 text-[#080808]" /></div><h2 className="font-bold text-[#080808]">{member.name}</h2></div><div className="space-y-3">{(['apprendre', 'partager', 'recherche_collab'] as const).map((type) => { const items = member.skills.filter((skill) => skill.skill_type === type); if (!items.length) return null; const Icon = type === 'apprendre' ? BookOpen : type === 'partager' ? HandHelping : MessagesSquare; const label = type === 'apprendre' ? 'Souhaite apprendre' : type === 'partager' ? 'Peut partager' : 'Recherche une collaboration'; return <div key={type}><p className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-1"><Icon className="w-3.5 h-3.5 text-[#FFD400]" /> {label}</p><div className="flex flex-wrap gap-1.5">{items.map((skill) => <Badge key={skill.id}>{skill.skill_name}</Badge>)}</div></div>; })}</div></article>)}</div>}</main></div>;
}
