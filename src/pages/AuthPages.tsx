import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter, Link } from '@/lib/router';
import { Mail, Lock, User as UserIcon, AlertCircle, ArrowRight } from 'lucide-react';

export function LoginPage() {
  const { signIn } = useAuth();
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      navigate('/tableau-de-bord');
    }
  }

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-[#FFD400] rounded-lg flex items-center justify-center">
              <span className="text-[#080808] font-extrabold text-xl">N</span>
            </div>
            <span className="font-extrabold text-2xl text-white">
              Nexus<span className="text-[#FFD400]">Lab</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-1">Connexion</h1>
          <p className="text-sm text-gray-400">Accède à ton espace personnel</p>
        </div>

        <div className="bg-white rounded-2xl p-6 md:p-8">
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#FFD400]"
                  placeholder="ton@email.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mot de passe</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#FFD400]"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#FFD400] text-[#080808] font-bold rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-50"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Pas encore de compte ?{' '}
            <Link to="/inscription" className="text-[#080808] font-semibold hover:text-[#FFD400]">
              Créer un compte
            </Link>
          </p>
        </div>
        <p className="text-center text-xs text-gray-500 mt-4">
          <Link to="/" className="hover:text-[#FFD400]">← Retour à l'accueil</Link>
        </p>
      </div>
    </div>
  );
}

export function SignUpPage() {
  const { signUp } = useAuth();
  const { navigate } = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, displayName);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/tableau-de-bord'), 1500);
    }
  }

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-[#FFD400] rounded-lg flex items-center justify-center">
              <span className="text-[#080808] font-extrabold text-xl">N</span>
            </div>
            <span className="font-extrabold text-2xl text-white">
              Nexus<span className="text-[#FFD400]">Lab</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-1">Créer un compte</h1>
          <p className="text-sm text-gray-400">Gratuit. Pour toujours.</p>
        </div>

        <div className="bg-white rounded-2xl p-6 md:p-8">
          {success ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="font-bold text-[#080808] mb-1">Compte créé !</h3>
              <p className="text-sm text-gray-500">Redirection en cours...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nom affiché</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#FFD400]"
                      placeholder="Ton nom"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#FFD400]"
                      placeholder="ton@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mot de passe</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#FFD400]"
                      placeholder="Minimum 6 caractères"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#FFD400] text-[#080808] font-bold rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {loading ? 'Création...' : <>Créer mon compte <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
              <p className="text-center text-sm text-gray-500 mt-4">
                Déjà un compte ?{' '}
                <Link to="/connexion" className="text-[#080808] font-semibold hover:text-[#FFD400]">
                  Se connecter
                </Link>
              </p>
            </>
          )}
        </div>
        <p className="text-center text-xs text-gray-500 mt-4">
          <Link to="/" className="hover:text-[#FFD400]">← Retour à l'accueil</Link>
        </p>
      </div>
    </div>
  );
}
