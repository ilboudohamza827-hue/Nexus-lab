import { useState } from 'react';
import { Link, useRouter } from '@/lib/router';
import { useAuth } from '@/lib/auth';
import { Menu, X, Search, Heart, User as UserIcon, LogOut, LayoutDashboard, Shield } from 'lucide-react';

export function Header() {
  const { path, navigate } = useRouter();
  const { user, profile, signOut, isAdmin, isEditor } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Accueil', to: '/' },
    { label: 'Catalogue', to: '/catalogue' },
    { label: 'Pour toi', to: '/pour-toi' },
    { label: 'Hub', to: '/hub' },
    { label: 'Vidéos', to: '/videos' },
    { label: 'À propos', to: '/a-propos' },
  ];

  const isActive = (to: string) => {
    if (to === '/') return path === '/';
    return path.startsWith(to);
  };

  function handleNavClick(to: string) {
    setMobileOpen(false);
    navigate(to);
  }

  return (
    <header className="sticky top-0 z-50 bg-[#080808] text-white border-b-2 border-[#FFD400]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-[#FFD400] rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
              <span className="text-[#080808] font-extrabold text-lg">N</span>
            </div>
            <span className="font-extrabold text-xl tracking-tight">
              Nexus<span className="text-[#FFD400]">Lab</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? 'text-[#FFD400]'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Link
                  to="/favoris"
                  className="p-2 text-gray-300 hover:text-[#FFD400] transition-colors"
                  title="Favoris"
                >
                  <Heart className="w-5 h-5" />
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-white/5 transition-colors"
                  >
                    <div className="w-8 h-8 bg-[#FFD400] rounded-full flex items-center justify-center">
                      <span className="text-[#080808] font-bold text-sm">
                        {(profile?.display_name || user.email || '?')[0].toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium max-w-[120px] truncate">
                      {profile?.display_name || 'Mon compte'}
                    </span>
                  </button>
                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white text-[#080808] rounded-lg shadow-xl border border-gray-200 py-1 z-50 animate-scale-in">
                        <Link
                          to="/tableau-de-bord"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                        >
                          <LayoutDashboard className="w-4 h-4" /> Tableau de bord
                        </Link>
                        <Link
                          to="/profil"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                        >
                          <UserIcon className="w-4 h-4" /> Mon profil
                        </Link>
                        <Link
                          to="/questionnaire"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                        >
                          <Search className="w-4 h-4" /> Personnaliser
                        </Link>
                        {isEditor && (
                          <Link
                            to="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 border-t border-gray-100"
                          >
                            <Shield className="w-4 h-4" /> Administration
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            signOut();
                            navigate('/');
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 w-full text-left border-t border-gray-100"
                        >
                          <LogOut className="w-4 h-4" /> Déconnexion
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/connexion"
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  to="/inscription"
                  className="px-4 py-2 text-sm font-bold bg-[#FFD400] text-[#080808] rounded-lg hover:bg-yellow-300 transition-colors"
                >
                  S'inscrire
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 text-gray-300 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#080808] border-t border-gray-800 animate-slide-in">
          <nav className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.to}
                onClick={() => handleNavClick(link.to)}
                className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                  isActive(link.to)
                    ? 'text-[#FFD400] bg-white/5'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </button>
            ))}
            <div className="border-t border-gray-800 pt-3 mt-3 space-y-1">
              {user ? (
                <>
                  <button
                    onClick={() => handleNavClick('/tableau-de-bord')}
                    className="block w-full text-left px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-white/5"
                  >
                    Tableau de bord
                  </button>
                  <button
                    onClick={() => handleNavClick('/favoris')}
                    className="block w-full text-left px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-white/5"
                  >
                    Favoris
                  </button>
                  <button
                    onClick={() => handleNavClick('/profil')}
                    className="block w-full text-left px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-white/5"
                  >
                    Mon profil
                  </button>
                  {isEditor && (
                    <button
                      onClick={() => handleNavClick('/admin')}
                      className="block w-full text-left px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-white/5"
                    >
                      Administration
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      signOut();
                      navigate('/');
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-white/5"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleNavClick('/connexion')}
                    className="block w-full text-left px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-white/5"
                  >
                    Connexion
                  </button>
                  <button
                    onClick={() => handleNavClick('/inscription')}
                    className="block w-full text-left px-3 py-2 rounded-md text-sm font-bold text-[#FFD400]"
                  >
                    S'inscrire
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  const { navigate } = useRouter();
  const { isAdmin, isEditor } = useAuth();

  return (
    <footer className="bg-[#080808] text-gray-400 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-[#FFD400] rounded-lg flex items-center justify-center">
                <span className="text-[#080808] font-extrabold text-lg">N</span>
              </div>
              <span className="font-extrabold text-xl text-white">
                Nexus<span className="text-[#FFD400]">Lab</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 max-w-md">
              Le potentiel est partout. Les opportunités doivent l'être aussi. NexusLab centralise
              les bourses, formations, concours et opportunités pour les élèves et étudiants du
              Burkina Faso et d'Afrique francophone.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm mb-3">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate('/catalogue')} className="hover:text-[#FFD400] transition-colors">Catalogue</button></li>
              <li><button onClick={() => navigate('/pour-toi')} className="hover:text-[#FFD400] transition-colors">Pour toi</button></li>
              <li><button onClick={() => navigate('/videos')} className="hover:text-[#FFD400] transition-colors">Vidéos</button></li>
              <li><button onClick={() => navigate('/a-propos')} className="hover:text-[#FFD400] transition-colors">À propos</button></li>
              <li><button onClick={() => navigate('/contact')} className="hover:text-[#FFD400] transition-colors">Contact</button></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm mb-3">Informations</h3>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate('/confidentialite')} className="hover:text-[#FFD400] transition-colors">Politique de confidentialité</button></li>
              <li><button onClick={() => navigate('/mentions-legales')} className="hover:text-[#FFD400] transition-colors">Mentions légales</button></li>
              {isEditor && (
                <li><button onClick={() => navigate('/admin')} className="hover:text-[#FFD400] transition-colors">Administration</button></li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} NexusLab. Plateforme éducative à vocation non lucrative.
          </p>
          <p className="text-xs text-gray-500">
            Gratuit pour tous les utilisateurs.
          </p>
        </div>
      </div>
    </footer>
  );
}
