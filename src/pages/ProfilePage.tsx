import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter, Link } from '@/lib/router';
import { supabase } from '@/lib/supabase';
import type { QuestionnaireAnswers, StudyField } from '@/lib/types';
import { LoadingSpinner, Badge } from '@/components/UI';
import { User as UserIcon, Target, Save, Check, Shield, Mail } from 'lucide-react';

export function ProfilePage() {
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  const { navigate } = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [answers, setAnswers] = useState<QuestionnaireAnswers | null>(null);
  const [studyFields, setStudyFields] = useState<StudyField[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/connexion');
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (profile) setDisplayName(profile.display_name);
  }, [profile]);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const [qaRes, fieldRes] = await Promise.all([
        supabase.from('questionnaire_answers').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('study_fields').select('*').eq('is_active', true).order('sort_order'),
      ]);
      if (qaRes.data) {
        setAnswers((qaRes.data as unknown as { answers: QuestionnaireAnswers }).answers);
      }
      setStudyFields(fieldRes.data as StudyField[] ?? []);
    }
    load();
  }, [user]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({ display_name: displayName }).eq('id', user.id);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (authLoading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#080808] text-white py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <UserIcon className="w-6 h-6 text-[#FFD400]" /> Mon profil
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Profile info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-bold text-lg text-[#080808] mb-4">Informations personnelles</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nom affiché</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#FFD400]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Mail className="w-4 h-4" /> {user.email}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Rôle</label>
              <div className="flex items-center gap-2">
                <Badge variant={profile?.role === 'admin' ? 'yellow' : 'default'}>
                  {profile?.role === 'admin' ? 'Administrateur' : profile?.role === 'editor' ? 'Éditeur' : 'Utilisateur'}
                </Badge>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFD400] text-[#080808] font-bold text-sm rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-50"
            >
              {saved ? <><Check className="w-4 h-4" /> Enregistré</> : saving ? 'Enregistrement...' : <><Save className="w-4 h-4" /> Enregistrer</>}
            </button>
          </div>
        </div>

        {/* Questionnaire summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-[#080808] flex items-center gap-2">
              <Target className="w-5 h-5 text-[#FFD400]" /> Mon profil de personnalisation
            </h2>
            <Link to="/questionnaire" className="text-sm font-semibold text-[#080808] hover:text-[#FFD400]">
              Modifier →
            </Link>
          </div>
          {answers ? (
            <dl className="space-y-3 text-sm">
              {answers.study_level && (
                <div className="flex gap-2">
                  <dt className="text-gray-500 flex-shrink-0 w-40">Niveau d'études:</dt>
                  <dd className="font-medium text-[#080808]">{answers.study_level}</dd>
                </div>
              )}
              {answers.objectives && answers.objectives.length > 0 && (
                <div className="flex gap-2">
                  <dt className="text-gray-500 flex-shrink-0 w-40">Objectifs:</dt>
                  <dd className="font-medium text-[#080808]">{answers.objectives.join(', ')}</dd>
                </div>
              )}
              {answers.study_fields && answers.study_fields.length > 0 && (
                <div className="flex gap-2">
                  <dt className="text-gray-500 flex-shrink-0 w-40">Domaines:</dt>
                  <dd className="font-medium text-[#080808]">
                    {answers.study_fields.map((slug) => studyFields.find((f) => f.slug === slug)?.name ?? slug).join(', ')}
                  </dd>
                </div>
              )}
              {answers.destination && (
                <div className="flex gap-2">
                  <dt className="text-gray-500 flex-shrink-0 w-40">Destination:</dt>
                  <dd className="font-medium text-[#080808]">{answers.destination}</dd>
                </div>
              )}
              {answers.diploma && (
                <div className="flex gap-2">
                  <dt className="text-gray-500 flex-shrink-0 w-40">Diplôme:</dt>
                  <dd className="font-medium text-[#080808]">{answers.diploma}</dd>
                </div>
              )}
              {answers.nationality && (
                <div className="flex gap-2">
                  <dt className="text-gray-500 flex-shrink-0 w-40">Nationalité:</dt>
                  <dd className="font-medium text-[#080808]">{answers.nationality}</dd>
                </div>
              )}
              {answers.languages && answers.languages.length > 0 && (
                <div className="flex gap-2">
                  <dt className="text-gray-500 flex-shrink-0 w-40">Langues:</dt>
                  <dd className="font-medium text-[#080808]">{answers.languages.join(', ')}</dd>
                </div>
              )}
            </dl>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 mb-3">Tu n'as pas encore rempli le questionnaire.</p>
              <Link
                to="/questionnaire"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#080808] text-white font-semibold text-sm rounded-lg hover:bg-[#FFD400] hover:text-[#080808] transition-colors"
              >
                <Target className="w-4 h-4" /> Commencer
              </Link>
            </div>
          )}
        </div>

        {/* Data privacy */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-bold text-lg text-[#080808] mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#FFD400]" /> Données et confidentialité
          </h2>
          <p className="text-sm text-gray-500 mb-3">
            NexusLab ne collecte que les données nécessaires à la personnalisation de ton expérience.
            Tu peux demander l'exportation ou la suppression de tes données à tout moment via la page Contact.
          </p>
          <Link to="/confidentialite" className="text-sm font-semibold text-[#080808] hover:text-[#FFD400]">
            Lire la politique de confidentialité →
          </Link>
        </div>
      </div>
    </div>
  );
}
