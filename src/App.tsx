import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/lib/toast';
import { RouterProvider, useRouter, parseRoute } from '@/lib/router';
import { Header, Footer } from '@/components/Layout';
import { HomePage } from '@/pages/HomePage';
import { CatalogPage } from '@/pages/CatalogPage';
import { OpportunityDetailPage } from '@/pages/OpportunityDetailPage';
import { LoginPage, SignUpPage } from '@/pages/AuthPages';
import { QuestionnairePage } from '@/pages/QuestionnairePage';
import { PourToiPage } from '@/pages/PourToiPage';
import { FavoritesPage } from '@/pages/FavoritesPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { VideosPage } from '@/pages/VideosPage';
import { UserDashboardPage } from '@/pages/UserDashboardPage';
import { AboutPage, ContactPage, PrivacyPage, LegalPage, NotFoundPage } from '@/pages/StaticPages';
import { AdminDashboardPage, AdminOpportunitiesPage, AdminSubHeader } from '@/pages/admin/AdminLayout';
import { AdminOpportunityEditPage } from '@/pages/admin/AdminOpportunityEditPage';
import { AdminVideosPage, AdminCategoriesPage, AdminUsersPage, AdminReportsPage } from '@/pages/admin/AdminPages';
import { HubHomePage, HubActivitiesPage, HubClubsPage, HubProjectsPage, HubGalleryPage } from '@/pages/hub/HubPages';
import { HubActivityDetailPage, HubClubDetailPage, HubProjectDetailPage } from '@/pages/hub/HubDetailPages';
import { AdminHubActivitiesPage, AdminHubClubsPage, AdminHubProjectsPage, AdminHubGalleryPage } from '@/pages/hub/AdminHubPages';

function AppContent() {
  const { path } = useRouter();
  const route = parseRoute(path);

  // Pages without header/footer (auth pages)
  if (route.name === 'login') return <LoginPage />;
  if (route.name === 'signup') return <SignUpPage />;
  if (route.name === 'not-found') return <NotFoundPage />;

  const renderPage = () => {
    switch (route.name) {
      case 'home': return <HomePage />;
      case 'catalog': return <CatalogPage />;
      case 'opportunity-detail': return <OpportunityDetailPage slug={route.params.slug} />;
      case 'questionnaire': return <QuestionnairePage />;
      case 'pour-toi': return <PourToiPage />;
      case 'favorites': return <FavoritesPage />;
      case 'profile': return <ProfilePage />;
      case 'videos': return <VideosPage />;
      case 'user-dashboard': return <UserDashboardPage />;
      case 'about': return <AboutPage />;
      case 'contact': return <ContactPage />;
      case 'privacy': return <PrivacyPage />;
      case 'legal': return <LegalPage />;
      case 'admin-dashboard': return <AdminDashboardPage />;
      case 'admin-opportunities': return <AdminOpportunitiesPage />;
      case 'admin-opportunity-edit': return <AdminOpportunityEditPage id={route.params.id} />;
      case 'admin-videos': return <AdminVideosPage />;
      case 'admin-categories': return <AdminCategoriesPage />;
      case 'admin-users': return <AdminUsersPage />;
      case 'admin-reports': return <AdminReportsPage />;
      case 'hub-home': return <HubHomePage />;
      case 'hub-activities': return <HubActivitiesPage />;
      case 'hub-activity-detail': return <HubActivityDetailPage slug={route.params.slug} />;
      case 'hub-clubs': return <HubClubsPage />;
      case 'hub-club-detail': return <HubClubDetailPage slug={route.params.slug} />;
      case 'hub-projects': return <HubProjectsPage />;
      case 'hub-project-detail': return <HubProjectDetailPage slug={route.params.slug} />;
      case 'hub-gallery': return <HubGalleryPage />;
      case 'admin-hub-activities': return <AdminHubActivitiesPage />;
      case 'admin-hub-clubs': return <AdminHubClubsPage />;
      case 'admin-hub-projects': return <AdminHubProjectsPage />;
      case 'admin-hub-gallery': return <AdminHubGalleryPage />;
      default: return <NotFoundPage />;
    }
  };

  const isAdminPage = route.name.startsWith('admin');

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1">{renderPage()}</main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RouterProvider>
          <AppContent />
        </RouterProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
