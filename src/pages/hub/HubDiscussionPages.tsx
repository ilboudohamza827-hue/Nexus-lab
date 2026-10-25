import { useEffect, useState } from 'react';
import { ArrowRight, MessageCircle, Send, Plus, UserRound } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Link, useRouter } from '@/lib/router';
import { useAuth } from '@/lib/auth';
import type { HubDiscussion, HubDiscussionPost } from '@/lib/types';
import { EmptyState, LoadingSpinner } from '@/components/UI';

function DiscussionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="bg-[#080808] text-white py-9"><div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"><Link to="/hub" className="text-xs text-gray-500 hover:text-[#FFD400]">Hub / Discussion</Link><h1 className="text-2xl md:text-3xl font-extrabold mt-2">{title}</h1><p className="text-sm text-gray-400 mt-2">{subtitle}</p></div></div>;
}

export function HubDiscussionPage() {
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState<HubDiscussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const { navigate } = useRouter();

  async function load() {
    const { data } = await supabase.from('hub_discussions').select('*').is('club_id', null).is('project_id', null).order('updated_at', { ascending: false });
    setDiscussions((data as HubDiscussion[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function createDiscussion() {
    if (!user || title.trim().length < 3) return;
    setSaving(true);
    const { data } = await supabase.from('hub_discussions').insert({ title: title.trim(), created_by: user.id }).select().maybeSingle();
    setSaving(false);
    if (data) { setTitle(''); setShowForm(false); navigate(`/hub/discussions/${data.id}`); }
  }

  return <div className="min-h-screen bg-gray-50"><DiscussionHeader title="Discussion générale" subtitle="Pose une question, partage une ressource et avance avec la communauté." /><main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{user && <div className="flex justify-end mb-5"><button onClick={() => setShowForm((value) => !value)} className="px-4 py-2.5 bg-[#FFD400] text-[#080808] font-bold text-sm rounded-xl inline-flex items-center gap-2 hover:bg-yellow-300"><Plus className="w-4 h-4" /> Nouveau sujet</button></div>}{showForm && <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5"><label className="block text-sm font-semibold text-[#080808] mb-2">Titre de la discussion</label><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex. Comment choisir mon premier projet ?" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#FFD400]" /><button onClick={createDiscussion} disabled={saving || title.trim().length < 3} className="mt-3 px-4 py-2 bg-[#080808] text-white rounded-lg text-sm font-bold disabled:opacity-50">{saving ? 'Création...' : 'Créer le sujet'}</button></div>}{!user && <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-900 mb-5">Connecte-toi pour participer aux discussions.</div>}{loading ? <LoadingSpinner /> : discussions.length === 0 ? <EmptyState title="La discussion commence ici" message="Aucun sujet n'a encore été créé. Lance la première conversation de la communauté." actionLabel={user ? 'Nouveau sujet' : undefined} onAction={user ? () => setShowForm(true) : undefined} /> : <div className="space-y-3">{discussions.map((discussion) => <Link key={discussion.id} to={`/hub/discussions/${discussion.id}`} className="bg-white rounded-2xl border border-gray-200 p-5 nx-card flex items-center gap-4 group"><div className="w-11 h-11 rounded-xl bg-[#080808] flex items-center justify-center flex-shrink-0"><MessageCircle className="w-5 h-5 text-[#FFD400]" /></div><div className="flex-1 min-w-0"><h2 className="font-bold text-[#080808] truncate">{discussion.title}</h2><p className="text-xs text-gray-500 mt-1">Discussion générale</p></div><ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#FFD400]" /></Link>)}</div>}</main></div>;
}

export function HubDiscussionDetailPage({ id }: { id: string }) {
  const { user } = useAuth();
  const [discussion, setDiscussion] = useState<HubDiscussion | null>(null);
  const [posts, setPosts] = useState<HubDiscussionPost[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    const [discussionResult, postsResult] = await Promise.all([supabase.from('hub_discussions').select('*').eq('id', id).maybeSingle(), supabase.from('hub_discussion_posts').select('*').eq('discussion_id', id).order('created_at')]);
    setDiscussion(discussionResult.data as HubDiscussion | null);
    setPosts((postsResult.data as HubDiscussionPost[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [id]);

  async function addPost() {
    if (!user || !body.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('hub_discussion_posts').insert({ discussion_id: id, body: body.trim(), created_by: user.id });
    if (!error) { setBody(''); load(); }
    setSaving(false);
  }

  if (loading) return <LoadingSpinner />;
  if (!discussion) return <EmptyState title="Discussion introuvable" message="Ce sujet n'est plus disponible." />;
  return <div className="min-h-screen bg-gray-50"><DiscussionHeader title={discussion.title} subtitle="Échange dans le respect des règles de la communauté." /><main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><div className="space-y-3 mb-6">{posts.length === 0 ? <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center"><MessageCircle className="w-10 h-10 text-[#FFD400] mx-auto mb-3" /><p className="text-sm text-gray-500">Aucun message pour le moment. Sois le premier à répondre.</p></div> : posts.map((post) => <article key={post.id} className="bg-white rounded-2xl border border-gray-200 p-5"><div className="flex items-center gap-2 text-xs text-gray-500 mb-3"><UserRound className="w-4 h-4 text-[#FFD400]" /> Membre NexusLab</div><p className="text-sm text-gray-700 whitespace-pre-wrap leading-6">{post.body}</p></article>)}</div>{user ? <div className="bg-white rounded-2xl border border-gray-200 p-4"><textarea value={body} onChange={(event) => setBody(event.target.value)} rows={4} maxLength={4000} placeholder="Écris un message utile et respectueux..." className="w-full resize-none outline-none text-sm text-gray-700" /><div className="flex justify-between items-center mt-3"><span className="text-xs text-gray-500">{body.length}/4000</span><button onClick={addPost} disabled={saving || !body.trim()} className="px-4 py-2 bg-[#080808] text-white rounded-lg text-sm font-bold inline-flex items-center gap-2 disabled:opacity-50"><Send className="w-4 h-4" /> {saving ? 'Envoi...' : 'Publier'}</button></div></div> : <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-900">Connecte-toi pour répondre à cette discussion.</div>}</main></div>;
}
