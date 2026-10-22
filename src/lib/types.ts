export type UserRole = 'user' | 'editor' | 'admin';

export type OpportunityStatus =
  | 'brouillon'
  | 'a_verifier'
  | 'publiee'
  | 'verification_necessaire'
  | 'expiree'
  | 'archivee';

export type VideoStatus = 'brouillon' | 'publiee';

export type ReportStatus = 'ouvert' | 'en_cours' | 'resolu' | 'ferme';

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface StudyField {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Opportunity {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  organization: string | null;
  source_name: string | null;
  source_url: string | null;
  application_url: string | null;
  eligible_countries: string[];
  eligible_nationalities: string[];
  study_level: string | null;
  eligibility_criteria: string | null;
  academic_criteria: string | null;
  required_documents: string | null;
  open_date: string | null;
  deadline: string | null;
  fees: string | null;
  scholarship_amount: string | null;
  funding_type: string | null;
  status: OpportunityStatus;
  keywords: string[];
  published_at: string | null;
  last_verified_at: string | null;
  created_by: string | null;
  updated_at: string;
  created_at: string;
  category?: Category | null;
  study_fields?: StudyField[];
}

export interface Video {
  id: string;
  title: string;
  youtube_url: string;
  youtube_id: string;
  channel_name: string | null;
  description: string | null;
  video_category: string | null;
  study_level: string | null;
  keywords: string[];
  status: VideoStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuestionnaireAnswers {
  study_level?: string;
  objectives?: string[];
  study_fields?: string[];
  destination?: string;
  diploma?: string;
  nationality?: string;
  period?: string;
  languages?: string[];
}

export interface QuestionnaireRecord {
  id: string;
  user_id: string;
  answers: QuestionnaireAnswers;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  opportunity_id: string;
  created_at: string;
  opportunity?: Opportunity;
}

export interface Report {
  id: string;
  opportunity_id: string | null;
  user_id: string | null;
  reason: string;
  details: string | null;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
}

export interface AdminAuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface RecommendationResult {
  opportunity: Opportunity;
  matchType: 'confirmed' | 'to_verify' | 'no_match';
  score: number;
  reasons: string[];
}

export const STUDY_LEVELS = [
  'Collège',
  'Lycée',
  'Terminale / Bac',
  'Licence / Bachelor',
  'Master',
  'Doctorat',
  'Formation professionnelle',
  'Autre',
] as const;

export const OBJECTIVES = [
  'Trouver une bourse d\'études',
  'Étudier dans un autre pays',
  'Trouver une formation gratuite',
  'Participer à un concours',
  'Trouver un stage',
  'Découvrir des programmes académiques',
  'Développer des compétences',
  'Explorer différentes possibilités',
] as const;

export const DESTINATIONS = [
  'Burkina Faso',
  'Autres pays d\'Afrique',
  'Europe',
  'Amérique du Nord',
  'Asie',
  'Autres régions',
  'Toutes les destinations',
] as const;

export const VIDEO_CATEGORIES = [
  'Comment rechercher une bourse',
  'Comment préparer un dossier de candidature',
  'Comment rédiger un CV',
  'Comment rédiger une lettre de motivation',
  'Comment préparer un entretien',
  'Comment étudier à l\'étranger',
  'Comment choisir une filière',
  'Découverte des sciences et des métiers',
  'Méthodes d\'apprentissage',
  'Conseils pratiques',
] as const;

export const STATUS_LABELS: Record<OpportunityStatus, string> = {
  brouillon: 'Brouillon',
  a_verifier: 'À vérifier',
  publiee: 'Publiée',
  verification_necessaire: 'Vérification nécessaire',
  expiree: 'Expirée',
  archivee: 'Archivée',
};

export const STATUS_COLORS: Record<OpportunityStatus, string> = {
  brouillon: 'bg-gray-200 text-gray-700',
  a_verifier: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  publiee: 'bg-green-100 text-green-800',
  verification_necessaire: 'bg-orange-100 text-orange-800',
  expiree: 'bg-red-100 text-red-700',
  archivee: 'bg-gray-300 text-gray-500',
};

// ============================================================
// HUB TYPES
// ============================================================

export type ActivityStatus = 'brouillon' | 'publie' | 'complet' | 'termine' | 'annule';
export type ClubStatus = 'en_attente' | 'actif' | 'inactif' | 'refuse';
export type ProjectStatus = 'idee' | 'recherche_collab' | 'preparation' | 'en_cours' | 'test' | 'realise' | 'pause';
export type ModerationStatus = 'en_attente' | 'approuve' | 'refuse';
export type GalleryItemType = 'projet' | 'prototype' | 'creation' | 'atelier' | 'concours' | 'initiative' | 'temoignage';
export type GalleryItemStatus = 'brouillon' | 'publie' | 'archive';
export type RegistrationStatus = 'inscrit' | 'confirme' | 'present' | 'absent' | 'annule';
export type JoinRequestStatus = 'en_attente' | 'approuve' | 'refuse';
export type SkillType = 'apprendre' | 'partager' | 'recherche_collab';

export interface HubActivity {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  objectives: string | null;
  activity_date: string | null;
  end_date: string | null;
  location: string | null;
  is_online: boolean;
  online_link: string | null;
  target_audience: string | null;
  prerequisites: string | null;
  max_participants: number | null;
  registration_deadline: string | null;
  fees: string | null;
  organizer: string | null;
  status: ActivityStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  registration_count?: number;
  user_registration?: HubActivityRegistration | null;
}

export interface HubActivityRegistration {
  id: string;
  activity_id: string;
  user_id: string;
  status: RegistrationStatus;
  created_at: string;
}

export interface HubClubCategory {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface HubClub {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  mission: string | null;
  image_url: string | null;
  category_id: string | null;
  skills_developed: string | null;
  activities_description: string | null;
  membership_conditions: string | null;
  status: ClubStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  category?: HubClubCategory | null;
  member_count?: number;
  user_membership?: HubClubMember | null;
  user_join_request?: HubClubJoinRequest | null;
}

export interface HubClubMember {
  id: string;
  club_id: string;
  user_id: string;
  role: 'membre' | 'animateur' | 'responsable';
  joined_at: string;
}

export interface HubClubJoinRequest {
  id: string;
  club_id: string;
  user_id: string;
  message: string | null;
  status: JoinRequestStatus;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface HubProject {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  problem_statement: string | null;
  objectives: string | null;
  skills_needed: string[];
  roles_available: string[];
  status: ProjectStatus;
  moderation_status: ModerationStatus;
  gallery_enabled: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  user_membership?: HubProjectMember | null;
  user_join_request?: HubProjectJoinRequest | null;
}

export interface HubProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'chef_projet' | 'membre' | 'contributeur';
  joined_at: string;
}

export interface HubProjectJoinRequest {
  id: string;
  project_id: string;
  user_id: string;
  message: string | null;
  proposed_role: string | null;
  status: JoinRequestStatus;
  created_at: string;
  reviewed_at: string | null;
}

export interface HubGalleryItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  item_type: GalleryItemType;
  project_id: string | null;
  club_id: string | null;
  activity_id: string | null;
  contributor_names: string[];
  status: GalleryItemStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface HubMemberSkill {
  id: string;
  user_id: string;
  skill_name: string;
  skill_type: SkillType;
  created_at: string;
}

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  brouillon: 'Brouillon',
  publie: 'Publié',
  complet: 'Complet',
  termine: 'Terminé',
  annule: 'Annulé',
};

export const ACTIVITY_STATUS_COLORS: Record<ActivityStatus, string> = {
  brouillon: 'bg-gray-200 text-gray-700',
  publie: 'bg-green-100 text-green-800',
  complet: 'bg-orange-100 text-orange-800',
  termine: 'bg-gray-200 text-gray-500',
  annule: 'bg-red-100 text-red-700',
};

export const CLUB_STATUS_LABELS: Record<ClubStatus, string> = {
  en_attente: 'En attente de validation',
  actif: 'Actif',
  inactif: 'Inactif',
  refuse: 'Refusé',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  idee: 'Idée à développer',
  recherche_collab: 'Recherche de collaborateurs',
  preparation: 'En préparation',
  en_cours: 'En cours de réalisation',
  test: 'En test / expérimentation',
  realise: 'Réalisé',
  pause: 'Mis en pause',
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  idee: 'bg-blue-100 text-blue-700',
  recherche_collab: 'bg-yellow-100 text-yellow-800',
  preparation: 'bg-purple-100 text-purple-700',
  en_cours: 'bg-green-100 text-green-800',
  test: 'bg-orange-100 text-orange-800',
  realise: 'bg-[#FFD400] text-[#080808]',
  pause: 'bg-gray-200 text-gray-500',
};

export const GALLERY_TYPE_LABELS: Record<GalleryItemType, string> = {
  projet: 'Projet',
  prototype: 'Prototype',
  creation: 'Création',
  atelier: 'Atelier',
  concours: 'Concours',
  initiative: 'Initiative',
  temoignage: 'Témoignage',
};

export const SKILL_TYPE_LABELS: Record<SkillType, string> = {
  apprendre: 'Je souhaite apprendre',
  partager: 'Je peux partager',
  recherche_collab: 'Je cherche des coéquipiers',
};
