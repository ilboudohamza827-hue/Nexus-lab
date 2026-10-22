import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter, Link } from '@/lib/router';
import { supabase } from '@/lib/supabase';
import type { QuestionnaireAnswers, StudyField } from '@/lib/types';
import { STUDY_LEVELS, OBJECTIVES, DESTINATIONS } from '@/lib/types';
import { ArrowLeft, ArrowRight, Check, RotateCcw, Target } from 'lucide-react';

const STEPS = ['Niveau d\'études', 'Objectifs', 'Domaine d\'intérêt', 'Destination', 'Informations complémentaires'];

export function QuestionnairePage() {
  const { user, loading: authLoading } = useAuth();
  const { navigate } = useRouter();
  const [step, setStep] = useState(0);
  const [studyFields, setStudyFields] = useState<StudyField[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [answers, setAnswers] = useState<QuestionnaireAnswers>({
    study_level: '',
    objectives: [],
    study_fields: [],
    destination: '',
    diploma: '',
    nationality: '',
    period: '',
    languages: [],
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/connexion');
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('study_fields')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      setStudyFields(data as StudyField[] ?? []);

      if (user) {
        const { data: existing } = await supabase
          .from('questionnaire_answers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        if (existing) {
          setAnswers((existing as unknown as { answers: QuestionnaireAnswers }).answers || {});
        }
      }
    }
    load();
  }, [user]);

  const progress = ((step + 1) / STEPS.length) * 100;

  function toggleArrayValue(key: keyof QuestionnaireAnswers, value: string) {
    setAnswers((prev) => {
      const arr = (prev[key] as string[]) || [];
      if (arr.includes(value)) {
        return { ...prev, [key]: arr.filter((v) => v !== value) };
      } else {
        return { ...prev, [key]: [...arr, value] };
      }
    });
  }

  function canProceed(): boolean {
    if (step === 0) return !!answers.study_level;
    if (step === 1) return (answers.objectives?.length ?? 0) > 0;
    if (step === 2) return (answers.study_fields?.length ?? 0) > 0;
    if (step === 3) return !!answers.destination;
    return true; // Step 4 is optional
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      save(true);
    }
  }

  function prev() {
    if (step > 0) setStep(step - 1);
  }

  async function save(complete: boolean) {
    if (!user) return;
    setSaving(true);
    const payload = { user_id: user.id, answers, is_complete: complete };
    const { data: existing } = await supabase
      .from('questionnaire_answers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('questionnaire_answers')
        .update({ answers, is_complete: complete, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
    } else {
      await supabase.from('questionnaire_answers').insert(payload);
    }
    setSaving(false);
    if (complete) {
      setSaved(true);
      setTimeout(() => navigate('/pour-toi'), 1200);
    }
  }

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Chargement...</p></div>;
  }

  if (saved) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#FFD400] rounded-2xl flex items-center justify-center mx-auto mb-4 animate-scale-in">
            <Check className="w-8 h-8 text-[#080808]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Profil enregistré !</h2>
          <p className="text-gray-500">Redirection vers ton espace personnalisé...</p>
        </div>
      </div>
    );
  }

  const selectableFields = studyFields.filter((f) => f.slug !== 'indecis');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress header */}
      <div className="bg-[#080808] text-white py-6 sticky top-16 z-30">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[#FFD400]" />
              <h2 className="font-bold">Personnalisation</h2>
            </div>
            <span className="text-sm text-gray-500">Étape {step + 1} / {STEPS.length}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#FFD400] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">{STEPS[step]}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Step 0: Study level */}
        {step === 0 && (
          <div className="animate-fade-in">
            <h3 className="text-xl font-bold text-[#080808] mb-2">Quel est ton niveau d'études ?</h3>
            <p className="text-sm text-gray-500 mb-6">Sélectionne ton niveau actuel.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {STUDY_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => setAnswers({ ...answers, study_level: level })}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    answers.study_level === level
                      ? 'border-[#FFD400] bg-yellow-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-[#080808]">{level}</span>
                    {answers.study_level === level && <Check className="w-5 h-5 text-[#FFD400]" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Objectives */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h3 className="text-xl font-bold text-[#080808] mb-2">Quels sont tes objectifs ?</h3>
            <p className="text-sm text-gray-500 mb-6">Sélectionne un ou plusieurs objectifs.</p>
            <div className="space-y-2">
              {OBJECTIVES.map((obj) => (
                <button
                  key={obj}
                  onClick={() => toggleArrayValue('objectives', obj)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                    answers.objectives?.includes(obj)
                      ? 'border-[#FFD400] bg-yellow-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium text-sm text-[#080808]">{obj}</span>
                  {answers.objectives?.includes(obj) && <Check className="w-5 h-5 text-[#FFD400]" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Study fields */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h3 className="text-xl font-bold text-[#080808] mb-2">Quels domaines t'intéressent ?</h3>
            <p className="text-sm text-gray-500 mb-6">Sélectionne un ou plusieurs domaines.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectableFields.map((field) => (
                <button
                  key={field.id}
                  onClick={() => toggleArrayValue('study_fields', field.slug)}
                  className={`p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                    answers.study_fields?.includes(field.slug)
                      ? 'border-[#FFD400] bg-yellow-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="font-semibold text-sm text-[#080808]">{field.name}</span>
                  {answers.study_fields?.includes(field.slug) && <Check className="w-5 h-5 text-[#FFD400]" />}
                </button>
              ))}
              <button
                onClick={() => toggleArrayValue('study_fields', 'indecis')}
                className={`p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between sm:col-span-2 ${
                  answers.study_fields?.includes('indecis')
                    ? 'border-[#FFD400] bg-yellow-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span className="font-semibold text-sm text-gray-500 italic">Je ne sais pas encore</span>
                {answers.study_fields?.includes('indecis') && <Check className="w-5 h-5 text-[#FFD400]" />}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Destination */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h3 className="text-xl font-bold text-[#080808] mb-2">Où souhaites-tu étudier ?</h3>
            <p className="text-sm text-gray-500 mb-6">Choisis ta zone de préférence.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DESTINATIONS.map((dest) => (
                <button
                  key={dest}
                  onClick={() => setAnswers({ ...answers, destination: dest })}
                  className={`p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                    answers.destination === dest
                      ? 'border-[#FFD400] bg-yellow-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="font-semibold text-sm text-[#080808]">{dest}</span>
                  {answers.destination === dest && <Check className="w-5 h-5 text-[#FFD400]" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Additional info */}
        {step === 4 && (
          <div className="animate-fade-in">
            <h3 className="text-xl font-bold text-[#080808] mb-2">Informations complémentaires</h3>
            <p className="text-sm text-gray-500 mb-6">Ces informations sont facultatives mais aident à affiner tes recommandations.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Diplôme préparé ou obtenu</label>
                <input
                  type="text"
                  value={answers.diploma || ''}
                  onChange={(e) => setAnswers({ ...answers, diploma: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#FFD400]"
                  placeholder="Ex: Bac, Licence, Master..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Pays de résidence / Nationalité</label>
                <input
                  type="text"
                  value={answers.nationality || ''}
                  onChange={(e) => setAnswers({ ...answers, nationality: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#FFD400]"
                  placeholder="Ex: Burkina Faso"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Période de candidature recherchée</label>
                <input
                  type="text"
                  value={answers.period || ''}
                  onChange={(e) => setAnswers({ ...answers, period: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#FFD400]"
                  placeholder="Ex: Année prochaine, 2026..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Langues maîtrisées</label>
                <input
                  type="text"
                  value={(answers.languages || []).join(', ')}
                  onChange={(e) => setAnswers({ ...answers, languages: e.target.value.split(',').map((l) => l.trim()).filter(Boolean) })}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#FFD400]"
                  placeholder="Ex: Français, Anglais..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={prev}
            disabled={step === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-lg disabled:opacity-0 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Précédent
          </button>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => save(false)}
                disabled={saving}
                className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-lg"
              >
                {saving ? 'Enregistrement...' : 'Sauvegarder'}
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                onClick={next}
                disabled={!canProceed()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFD400] text-[#080808] font-bold text-sm rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-40"
              >
                Suivant <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => save(true)}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFD400] text-[#080808] font-bold text-sm rounded-lg hover:bg-yellow-300 transition-colors"
              >
                {saving ? 'Enregistrement...' : <>Valider <Check className="w-4 h-4" /></>}
              </button>
            )}
          </div>
        </div>

        {/* Skip link */}
        <div className="text-center mt-4">
          <Link to="/catalogue" className="text-xs text-gray-500 hover:text-[#080808]">
            Passer et explorer le catalogue →
          </Link>
        </div>
      </div>
    </div>
  );
}
