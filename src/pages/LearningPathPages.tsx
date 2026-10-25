import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, Circle, Clock3, LockKeyhole, PlayCircle, Target } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Link, useRouter } from '@/lib/router';
import { useAuth } from '@/lib/auth';
import type { LearningPath, LearningPathProgress, LearningPathStep } from '@/lib/types';
import { EmptyState, LoadingSpinner, Badge } from '@/components/UI';

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="bg-[#080808] text-white py-9"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><Link to="/hub" className="text-xs text-gray-500 hover:text-[#FFD400]">Hub / Apprendre</Link><h1 className="text-2xl md:text-3xl font-extrabold mt-2">{title}</h1><p className="text-sm text-gray-400 mt-2 max-w-2xl">{subtitle}</p></div></div>;
}

export function LearningPathsPage() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('learning_paths').select('*').eq('is_published', true).order('created_at', { ascending: false });
      setPaths((data as LearningPath[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  return <div className="min-h-screen bg-gray-50"><PageHeader title="Parcours d'apprentissage" subtitle="Avance étape par étape, pratique avec d'autres et garde une trace de tes réalisations." /><main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{loading ? <LoadingSpinner message="Chargement des parcours..." /> : paths.length === 0 ? <EmptyState title="Aucun parcours disponible" message="Les premiers parcours seront publiés prochainement." /> : <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{paths.map((path) => <Link key={path.id} to={`/parcours/${path.slug}`} className="bg-white rounded-2xl border border-gray-200 p-6 nx-card group"><div className="flex items-start justify-between gap-4"><div className="w-12 h-12 bg-[#080808] rounded-xl flex items-center justify-center"><BookOpen className="w-6 h-6 text-[#FFD400]" /></div><ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#FFD400] transition-colors" /></div><h2 className="font-bold text-xl text-[#080808] mt-5 mb-2">{path.title}</h2><p className="text-sm text-gray-500 leading-6 mb-5">{path.description}</p><div className="flex flex-wrap gap-2 mb-5">{path.skills.slice(0, 4).map((skill) => <Badge key={skill}>{skill}</Badge>)}</div><div className="flex items-center gap-4 text-xs text-gray-500"><span className="inline-flex items-center gap-1"><Clock3 className="w-4 h-4 text-[#FFD400]" /> {path.estimated_duration ?? 'À ton rythme'}</span><span className="inline-flex items-center gap-1"><Target className="w-4 h-4 text-[#FFD400]" /> {path.target_level ?? 'Tous niveaux'}</span></div></Link>)}</div>}</main></div>;
}

export function LearningPathDetailPage({ slug }: { slug: string }) {
  const { user } = useAuth();
  const [path, setPath] = useState<LearningPath | null>(null);
  const [steps, setSteps] = useState<LearningPathStep[]>([]);
  const [progress, setProgress] = useState<LearningPathProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const pathResult = await supabase.from('learning_paths').select('*').eq('slug', slug).maybeSingle();
      if (!pathResult.data) { setLoading(false); return; }
      const stepResult = await supabase.from('learning_path_steps').select('*').eq('path_id', pathResult.data.id).order('sort_order');
      const progressResult = user ? await supabase.from('learning_path_progress').select('*').eq('path_id', pathResult.data.id).eq('user_id', user.id) : { data: [] };
      setPath(pathResult.data as LearningPath);
      setSteps((stepResult.data as LearningPathStep[]) ?? []);
      setProgress((progressResult.data as LearningPathProgress[]) ?? []);
      setLoading(false);
    }
    load();
  }, [slug, user]);

  const completed = useMemo(() => progress.filter((item) => item.status === 'terminee').length, [progress]);

  async function updateProgress(step: LearningPathStep) {
    if (!user || !path) return;
    const current = progress.find((item) => item.step_id === step.id);
    const nextStatus = current?.status === 'terminee' ? 'a_faire' : 'terminee';
    setSaving(step.id);
    const { data, error } = await supabase.from('learning_path_progress').upsert({ path_id: path.id, step_id: step.id, user_id: user.id, status: nextStatus }, { onConflict: 'user_id,step_id' }).select().maybeSingle();
    if (!error && data) setProgress((items) => [...items.filter((item) => item.step_id !== step.id), data as LearningPathProgress]);
    setSaving(null);
  }

  if (loading) return <LoadingSpinner message="Chargement du parcours..." />;
  if (!path) return <EmptyState title="Parcours introuvable" message="Ce parcours n'est pas disponible ou a été retiré." />;

  return <div className="min-h-screen bg-gray-50"><PageHeader title={path.title} subtitle={path.description} /><main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mb-6"><div className="flex flex-wrap gap-2 mb-5">{path.skills.map((skill) => <Badge key={skill} variant="yellow">{skill}</Badge>)}</div><div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm"><div><p className="text-xs text-gray-500 mb-1">Objectif</p><p className="font-semibold text-[#080808]">{path.objective ?? 'Construire progressivement tes compétences'}</p></div><div><p className="text-xs text-gray-500 mb-1">Durée estimée</p><p className="font-semibold text-[#080808]">{path.estimated_duration ?? 'À ton rythme'}</p></div><div><p className="text-xs text-gray-500 mb-1">Progression</p><p className="font-semibold text-[#080808]">{completed} / {steps.length} étapes terminées</p></div></div>{!user && <div className="mt-6 rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-900 inline-flex items-center gap-2"><LockKeyhole className="w-4 h-4" /> Connecte-toi pour enregistrer ta progression.</div>}</div><div className="space-y-3">{steps.map((step, index) => { const current = progress.find((item) => item.step_id === step.id); const done = current?.status === 'terminee'; return <article key={step.id} className={`bg-white rounded-2xl border p-5 transition-colors ${done ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}`}><div className="flex gap-4"><button onClick={() => updateProgress(step)} disabled={!user || saving === step.id} className="flex-shrink-0 mt-0.5 disabled:cursor-not-allowed" aria-label={done ? 'Marquer comme à faire' : 'Marquer comme terminée'}>{done ? <CheckCircle2 className="w-7 h-7 text-green-600" /> : <Circle className="w-7 h-7 text-gray-300 hover:text-[#FFD400]" />}</button><div className="flex-1"><div className="flex flex-wrap items-center gap-2 mb-1"><span className="text-xs font-bold text-[#FFD400]">ÉTAPE {index + 1}</span>{done && <span className="text-xs font-semibold text-green-700">Terminée</span>}</div><h2 className="font-bold text-lg text-[#080808]">{step.title}</h2><p className="text-sm text-gray-500 mt-2 leading-6">{step.description}</p>{step.exercise && <div className="mt-4 rounded-xl bg-gray-50 border border-gray-200 p-3 text-sm"><span className="font-semibold text-[#080808]">À pratiquer : </span><span className="text-gray-600">{step.exercise}</span></div>}{step.resource_url && <a href={step.resource_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-[#080808] hover:text-[#FFD400]"><PlayCircle className="w-4 h-4" /> Ressource</a>}</div></div></article>; })}</div></main></div>;
}
