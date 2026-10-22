import { Link, useRouter } from '@/lib/router';
import { Compass, Target, ShieldCheck, Heart, Search, BookOpen, Mail } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#080808] text-white py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3">
            À propos de <span className="text-[#FFD400]">NexusLab</span>
          </h1>
          <p className="text-gray-500 text-lg">
            Le potentiel est partout. Les opportunités doivent l'être aussi.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <section>
          <h2 className="text-xl font-bold text-[#080808] mb-3">Notre mission</h2>
          <p className="text-gray-700 leading-relaxed">
            NexusLab est une plateforme éducative à vocation non lucrative dont la mission est de
            centraliser les opportunités destinées aux élèves et aux étudiants, afin de leur permettre
            de découvrir plus facilement celles qui correspondent à leur situation, à leurs ambitions
            et à leurs intérêts.
          </p>
          <p className="text-gray-700 leading-relaxed mt-3">
            La plateforme est particulièrement adaptée aux réalités du Burkina Faso et d'Afrique
            francophone, tout en permettant de découvrir des opportunités internationales.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#080808] mb-3">Nos principes</h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex gap-2"><span className="text-[#FFD400] font-bold">•</span> Accès gratuit pour tous les utilisateurs</li>
            <li className="flex gap-2"><span className="text-[#FFD400] font-bold">•</span> Informations fiables, vérifiables et à jour</li>
            <li className="flex gap-2"><span className="text-[#FFD400] font-bold">•</span> Personnalisation utile et transparente</li>
            <li className="flex gap-2"><span className="text-[#FFD400] font-bold">•</span> Priorité à l'expérience mobile</li>
            <li className="flex gap-2"><span className="text-[#FFD400] font-bold">•</span> Respect de la vie privée</li>
            <li className="flex gap-2"><span className="text-[#FFD400] font-bold">•</span> Transparence sur les critères d'éligibilité</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#080808] mb-3">Comment ça marche</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="w-12 h-12 bg-[#FFD400] rounded-xl flex items-center justify-center mb-3">
                <Compass className="w-6 h-6 text-[#080808]" />
              </div>
              <h3 className="font-bold text-sm text-[#080808] mb-1">1. Explore</h3>
              <p className="text-sm text-gray-500">Parcours le catalogue librement avec recherche et filtres.</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-[#FFD400] rounded-xl flex items-center justify-center mb-3">
                <Target className="w-6 h-6 text-[#080808]" />
              </div>
              <h3 className="font-bold text-sm text-[#080808] mb-1">2. Personnalise</h3>
              <p className="text-sm text-gray-500">Réponds au questionnaire pour des recommands adaptées.</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-[#FFD400] rounded-xl flex items-center justify-center mb-3">
                <ShieldCheck className="w-6 h-6 text-[#080808]" />
              </div>
              <h3 className="font-bold text-sm text-[#080808] mb-1">3. Postule</h3>
              <p className="text-sm text-gray-500">Accède aux sources officielles et candidature.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[#080808] mb-3">Honnêteté et transparence</h2>
          <p className="text-gray-700 leading-relaxed">
            NexusLab ne prétend pas posséder des partenaires, des financements ou des statistiques
            d'impact. Nous n'inventons aucune information pour remplir le site. Les opportunités sont
            publiées au fur et à mesure de leur vérification. NexusLab informe et oriente les candidats :
            il ne garantit ni l'obtention d'une bourse, ni une admission, ni une sélection.
          </p>
        </section>

        <div className="text-center py-6">
          <Link to="/catalogue" className="px-6 py-3 bg-[#FFD400] text-[#080808] font-bold rounded-xl hover:bg-yellow-300 transition-colors inline-flex items-center gap-2">
            <BookOpen className="w-5 h-5" /> Explorer le catalogue
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ContactPage() {
  const { navigate } = useRouter();
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#080808] text-white py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold mb-3">Contact</h1>
          <p className="text-gray-500">Une question, une suggestion ou une demande ? Écris-nous.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8 text-center">
          <div className="w-14 h-14 bg-[#FFD400] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail className="w-7 h-7 text-[#080808]" />
          </div>
          <h2 className="font-bold text-lg text-[#080808] mb-2">Nous contacter</h2>
          <p className="text-sm text-gray-500 mb-4">
            Pour toute question relative à NexusLab, signalement d'erreur, demande d'exportation
            ou suppression de données, tu peux nous écrire à :
          </p>
          <p className="font-bold text-[#080808]">contact@nexuslab.bf</p>
          <p className="text-xs text-gray-500 mt-4">
            NexusLab est un projet éducatif à vocation non lucrative, basé au Burkina Faso.
          </p>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/catalogue" className="px-5 py-2.5 bg-[#080808] text-white font-semibold text-sm rounded-lg hover:bg-[#FFD400] hover:text-[#080808] transition-colors text-center">
            Catalogue
          </Link>
          <button onClick={() => navigate('/a-propos')} className="px-5 py-2.5 border-2 border-gray-200 text-[#080808] font-semibold text-sm rounded-lg hover:border-[#080808] transition-colors">
            À propos
          </button>
        </div>
      </div>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#080808] text-white py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold mb-3">Politique de confidentialité</h1>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <section>
          <h2 className="text-xl font-bold text-[#080808] mb-2">Collecte des données</h2>
          <p className="text-gray-700 text-sm leading-relaxed">
            NexusLab ne collecte que les données nécessaires à son fonctionnement : adresse email,
            nom affiché, et réponses au questionnaire de personnalisation. Aucun document personnel
            sensible (pièce d'identité, dossier de candidature) n'est collecté pour la simple
            consultation du catalogue.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-[#080808] mb-2">Utilisation des données</h2>
          <p className="text-gray-700 text-sm leading-relaxed">
            Tes données sont utilisées uniquement pour personnaliser tes recommandations d'opportunités
            et gérer tes favoris. Elles ne sont jamais vendues ni partagées avec des tiers.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-[#080808] mb-2">Protection des mineurs</h2>
          <p className="text-gray-700 text-sm leading-relaxed">
            Certains utilisateurs pouvant être mineurs, NexusLab applique les mesures de protection
            et les règles de consentement pertinentes. Nous recommandons aux mineurs d'obtenir
            l'autorisation de leurs parents ou tuteurs légaux avant de créer un compte.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-[#080808] mb-2">Tes droits</h2>
          <p className="text-gray-700 text-sm leading-relaxed">
            Tu peux à tout moment demander l'exportation ou la suppression de tes données en nous
            contactant via la page Contact. Tu peux également supprimer ton compte directement
            depuis ton profil.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-[#080808] mb-2">Sécurité</h2>
          <p className="text-gray-700 text-sm leading-relaxed">
            Les mots de passe sont chiffrés et ne sont jamais stockés en clair. Les opérations
            sensibles sont protégées côté serveur. Les rôles administratifs sont attribués par une
            procédure sécurisée et ne peuvent pas être auto-attribués par les utilisateurs.
          </p>
        </section>
      </div>
    </div>
  );
}

export function LegalPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#080808] text-white py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold mb-3">Mentions légales</h1>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <section>
          <h2 className="text-xl font-bold text-[#080808] mb-2">Éditeur</h2>
          <p className="text-gray-700 text-sm leading-relaxed">
            NexusLab est un projet éducatif à vocation non lucrative, basé au Burkina Faso.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-[#080808] mb-2">Gratuité</h2>
          <p className="text-gray-700 text-sm leading-relaxed">
            NexusLab est entièrement gratuit pour les utilisateurs. Aucun abonnement payant, aucun
            paiement obligatoire, aucun mur payant. Aucune restriction n'est réservée à des
            utilisateurs payants.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-[#080808] mb-2">Limitation de responsabilité</h2>
          <p className="text-gray-700 text-sm leading-relaxed">
            NexusLab informe et oriente les candidats. Il ne garantit ni l'obtention d'une bourse,
            ni une admission, ni une sélection. Les informations publiées sont rattachées à des
            sources vérifiables mais peuvent évoluer. L'utilisateur est invité à vérifier les
            informations sur les sites officiels avant toute candidature.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-[#080808] mb-2">Propriété intellectuelle</h2>
          <p className="text-gray-700 text-sm leading-relaxed">
            Les vidéos intégrées proviennent de YouTube et restent la propriété de leurs auteurs.
            NexusLab ne télécharge ni ne republie ces vidéos. Les liens redirigent vers les
            sources officielles.
          </p>
        </section>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-20 h-20 bg-[#FFD400] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Search className="w-10 h-10 text-[#080808]" />
        </div>
        <h1 className="text-4xl font-extrabold text-white mb-2">404</h1>
        <p className="text-gray-500 mb-6">Cette page n'existe pas.</p>
        <Link to="/" className="px-6 py-3 bg-[#FFD400] text-[#080808] font-bold rounded-xl hover:bg-yellow-300 transition-colors">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
