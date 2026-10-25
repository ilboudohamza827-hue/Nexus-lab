import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface RouterContextValue {
  path: string;
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterContextValue | undefined>(undefined);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  function navigate(to: string) {
    window.history.pushState({}, '', to);
    setPath(to);
    window.scrollTo(0, 0);
  }

  return (
    <RouterContext.Provider value={{ path, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}

export function Link({
  to,
  children,
  className,
  onClick,
  title,
}: {
  to: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  title?: string;
}) {
  const { navigate } = useRouter();
  return (
    <a
      href={to}
      className={className}
      title={title}
      onClick={(e) => {
        e.preventDefault();
        navigate(to);
        onClick?.();
      }}
    >
      {children}
    </a>
  );
}

export function parseRoute(path: string): { name: string; params: Record<string, string> } {
  const segments = path.split('/').filter(Boolean);

  if (segments.length === 0) return { name: 'home', params: {} };
  if (segments[0] === 'catalogue') return { name: 'catalog', params: {} };
  if (segments[0] === 'opportunite' && segments[1])
    return { name: 'opportunity-detail', params: { slug: segments[1] } };
  if (segments[0] === 'pour-toi') return { name: 'pour-toi', params: {} };
  if (segments[0] === 'questionnaire') return { name: 'questionnaire', params: {} };
  if (segments[0] === 'profil') return { name: 'profile', params: {} };
  if (segments[0] === 'favoris') return { name: 'favorites', params: {} };
  if (segments[0] === 'videos') return { name: 'videos', params: {} };
  if (segments[0] === 'parcours' && segments[1]) return { name: 'learning-path-detail', params: { slug: segments[1] } };
  if (segments[0] === 'parcours') return { name: 'learning-paths', params: {} };
  if (segments[0] === 'a-propos') return { name: 'about', params: {} };
  if (segments[0] === 'contact') return { name: 'contact', params: {} };
  if (segments[0] === 'connexion') return { name: 'login', params: {} };
  if (segments[0] === 'inscription') return { name: 'signup', params: {} };
  if (segments[0] === 'tableau-de-bord') return { name: 'user-dashboard', params: {} };
  if (segments[0] === 'confidentialite') return { name: 'privacy', params: {} };
  if (segments[0] === 'mentions-legales') return { name: 'legal', params: {} };

  // Hub routes
  if (segments[0] === 'hub') {
    if (segments.length === 1) return { name: 'hub-home', params: {} };
    if (segments[1] === 'activites' && segments[2]) return { name: 'hub-activity-detail', params: { slug: segments[2] } };
    if (segments[1] === 'activites') return { name: 'hub-activities', params: {} };
    if (segments[1] === 'clubs' && segments[2]) return { name: 'hub-club-detail', params: { slug: segments[2] } };
    if (segments[1] === 'clubs') return { name: 'hub-clubs', params: {} };
    if (segments[1] === 'projets' && segments[2]) return { name: 'hub-project-detail', params: { slug: segments[2] } };
    if (segments[1] === 'projets') return { name: 'hub-projects', params: {} };
    if (segments[1] === 'realisations') return { name: 'hub-gallery', params: {} };
    if (segments[1] === 'membres') return { name: 'hub-members', params: {} };
    if (segments[1] === 'discussions' && segments[2]) return { name: 'hub-discussion-detail', params: { id: segments[2] } };
    if (segments[1] === 'discussions') return { name: 'hub-discussions', params: {} };
    return { name: 'hub-home', params: {} };
  }
  if (segments[0] === 'admin') {
    if (segments[1] === 'opportunites') return { name: 'admin-opportunities', params: {} };
    if (segments[1] === 'opportunite' && segments[1])
      return { name: 'admin-opportunity-edit', params: { id: segments[2] ?? 'new' } };
    if (segments[1] === 'videos') return { name: 'admin-videos', params: {} };
    if (segments[1] === 'categories') return { name: 'admin-categories', params: {} };
    if (segments[1] === 'utilisateurs') return { name: 'admin-users', params: {} };
    if (segments[1] === 'signalements') return { name: 'admin-reports', params: {} };
    if (segments[1] === 'hub-activites') return { name: 'admin-hub-activities', params: {} };
    if (segments[1] === 'hub-clubs') return { name: 'admin-hub-clubs', params: {} };
    if (segments[1] === 'hub-projets') return { name: 'admin-hub-projects', params: {} };
    if (segments[1] === 'hub-galerie') return { name: 'admin-hub-gallery', params: {} };
    return { name: 'admin-dashboard', params: {} };
  }

  return { name: 'not-found', params: {} };
}
