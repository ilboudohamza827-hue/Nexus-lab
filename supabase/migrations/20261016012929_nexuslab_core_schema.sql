/*
# NexusLab — Core Database Schema

## Overview
Creates the complete database schema for NexusLab, an educational opportunities platform.
Includes tables for user profiles, categories, study fields, opportunities, videos,
questionnaire answers, favorites, reports, and admin audit logging.

## Tables Created
1. `profiles` — extends auth.users with role (user/editor/admin) and display name
2. `categories` — opportunity categories (admin-managed)
3. `study_fields` — domains of study (admin-managed)
4. `opportunities` — the main entity with full detail fields
5. `opportunity_study_fields` — many-to-many junction (opportunities ↔ study_fields)
6. `videos` — educational YouTube videos
7. `video_opportunities` — many-to-many junction (videos ↔ opportunities)
8. `questionnaire_answers` — user QCM responses stored as JSONB
9. `favorites` — user saved opportunities
10. `reports` — error reports submitted by users
11. `admin_audit_log` — tracks administrative actions

## Security
- RLS enabled on all tables.
- Public read on published opportunities, categories, study fields, published videos.
- User-scoped CRUD on questionnaire_answers, favorites, reports.
- Admin/editor-only write on categories, study_fields, opportunities, videos.
- Helper functions: is_admin(), is_editor_or_admin() (SECURITY DEFINER).
- Auto-create profile trigger on auth.users insert.

## Notes
1. Only opportunities with status='publiee' are visible to the public.
2. Admin role is bootstrapped by manually updating profiles.role via SQL.
3. Profile auto-creation trigger assigns role='user' by default.
*/

-- ============================================================
-- STEP 1: Create profiles table (no policies yet)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'editor', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 2: Create helper functions (after profiles table exists)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_editor_or_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  );
$$;

-- ============================================================
-- STEP 3: Now add profiles policies
-- ============================================================

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- STEP 4: Auto-create profile trigger
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'user'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- CATEGORIES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_public" ON public.categories;
CREATE POLICY "categories_select_public" ON public.categories
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "categories_insert_editor" ON public.categories;
CREATE POLICY "categories_insert_editor" ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK (public.is_editor_or_admin());

DROP POLICY IF EXISTS "categories_update_editor" ON public.categories;
CREATE POLICY "categories_update_editor" ON public.categories
  FOR UPDATE TO authenticated
  USING (public.is_editor_or_admin())
  WITH CHECK (public.is_editor_or_admin());

DROP POLICY IF EXISTS "categories_delete_editor" ON public.categories;
CREATE POLICY "categories_delete_editor" ON public.categories
  FOR DELETE TO authenticated
  USING (public.is_editor_or_admin());

-- ============================================================
-- STUDY FIELDS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.study_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.study_fields ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "study_fields_select_public" ON public.study_fields;
CREATE POLICY "study_fields_select_public" ON public.study_fields
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "study_fields_insert_editor" ON public.study_fields;
CREATE POLICY "study_fields_insert_editor" ON public.study_fields
  FOR INSERT TO authenticated
  WITH CHECK (public.is_editor_or_admin());

DROP POLICY IF EXISTS "study_fields_update_editor" ON public.study_fields;
CREATE POLICY "study_fields_update_editor" ON public.study_fields
  FOR UPDATE TO authenticated
  USING (public.is_editor_or_admin())
  WITH CHECK (public.is_editor_or_admin());

DROP POLICY IF EXISTS "study_fields_delete_editor" ON public.study_fields;
CREATE POLICY "study_fields_delete_editor" ON public.study_fields
  FOR DELETE TO authenticated
  USING (public.is_editor_or_admin());

-- ============================================================
-- OPPORTUNITIES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  organization text,
  source_name text,
  source_url text,
  application_url text,
  eligible_countries text[] DEFAULT '{}',
  eligible_nationalities text[] DEFAULT '{}',
  study_level text,
  eligibility_criteria text,
  academic_criteria text,
  required_documents text,
  open_date date,
  deadline date,
  fees text,
  scholarship_amount text,
  funding_type text,
  status text NOT NULL DEFAULT 'brouillon' CHECK (status IN ('brouillon', 'a_verifier', 'publiee', 'verification_necessaire', 'expiree', 'archivee')),
  keywords text[] DEFAULT '{}',
  published_at timestamptz,
  last_verified_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_opportunities_status ON public.opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_category ON public.opportunities(category_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_deadline ON public.opportunities(deadline);
CREATE INDEX IF NOT EXISTS idx_opportunities_published_at ON public.opportunities(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_study_level ON public.opportunities(study_level);

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "opportunities_select_public" ON public.opportunities;
CREATE POLICY "opportunities_select_public" ON public.opportunities
  FOR SELECT TO anon, authenticated
  USING (status = 'publiee' OR public.is_editor_or_admin());

DROP POLICY IF EXISTS "opportunities_insert_editor" ON public.opportunities;
CREATE POLICY "opportunities_insert_editor" ON public.opportunities
  FOR INSERT TO authenticated
  WITH CHECK (public.is_editor_or_admin());

DROP POLICY IF EXISTS "opportunities_update_editor" ON public.opportunities;
CREATE POLICY "opportunities_update_editor" ON public.opportunities
  FOR UPDATE TO authenticated
  USING (public.is_editor_or_admin())
  WITH CHECK (public.is_editor_or_admin());

DROP POLICY IF EXISTS "opportunities_delete_editor" ON public.opportunities;
CREATE POLICY "opportunities_delete_editor" ON public.opportunities
  FOR DELETE TO authenticated
  USING (public.is_editor_or_admin());

-- ============================================================
-- OPPORTUNITY_STUDY_FIELDS (junction)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.opportunity_study_fields (
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  study_field_id uuid NOT NULL REFERENCES public.study_fields(id) ON DELETE CASCADE,
  PRIMARY KEY (opportunity_id, study_field_id)
);

ALTER TABLE public.opportunity_study_fields ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "osf_select_public" ON public.opportunity_study_fields;
CREATE POLICY "osf_select_public" ON public.opportunity_study_fields
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "osf_insert_editor" ON public.opportunity_study_fields;
CREATE POLICY "osf_insert_editor" ON public.opportunity_study_fields
  FOR INSERT TO authenticated
  WITH CHECK (public.is_editor_or_admin());

DROP POLICY IF EXISTS "osf_delete_editor" ON public.opportunity_study_fields;
CREATE POLICY "osf_delete_editor" ON public.opportunity_study_fields
  FOR DELETE TO authenticated
  USING (public.is_editor_or_admin());

-- ============================================================
-- VIDEOS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  youtube_url text NOT NULL,
  youtube_id text NOT NULL,
  channel_name text,
  description text,
  video_category text,
  study_level text,
  keywords text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'brouillon' CHECK (status IN ('brouillon', 'publiee')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "videos_select_public" ON public.videos;
CREATE POLICY "videos_select_public" ON public.videos
  FOR SELECT TO anon, authenticated
  USING (status = 'publiee' OR public.is_editor_or_admin());

DROP POLICY IF EXISTS "videos_insert_editor" ON public.videos;
CREATE POLICY "videos_insert_editor" ON public.videos
  FOR INSERT TO authenticated
  WITH CHECK (public.is_editor_or_admin());

DROP POLICY IF EXISTS "videos_update_editor" ON public.videos;
CREATE POLICY "videos_update_editor" ON public.videos
  FOR UPDATE TO authenticated
  USING (public.is_editor_or_admin())
  WITH CHECK (public.is_editor_or_admin());

DROP POLICY IF EXISTS "videos_delete_editor" ON public.videos;
CREATE POLICY "videos_delete_editor" ON public.videos
  FOR DELETE TO authenticated
  USING (public.is_editor_or_admin());

-- ============================================================
-- VIDEO_OPPORTUNITIES (junction)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.video_opportunities (
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  PRIMARY KEY (video_id, opportunity_id)
);

ALTER TABLE public.video_opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vo_select_public" ON public.video_opportunities;
CREATE POLICY "vo_select_public" ON public.video_opportunities
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "vo_insert_editor" ON public.video_opportunities;
CREATE POLICY "vo_insert_editor" ON public.video_opportunities
  FOR INSERT TO authenticated
  WITH CHECK (public.is_editor_or_admin());

DROP POLICY IF EXISTS "vo_delete_editor" ON public.video_opportunities;
CREATE POLICY "vo_delete_editor" ON public.video_opportunities
  FOR DELETE TO authenticated
  USING (public.is_editor_or_admin());

-- ============================================================
-- QUESTIONNAIRE_ANSWERS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.questionnaire_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '{}',
  is_complete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.questionnaire_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "qa_select_own" ON public.questionnaire_answers;
CREATE POLICY "qa_select_own" ON public.questionnaire_answers
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "qa_insert_own" ON public.questionnaire_answers;
CREATE POLICY "qa_insert_own" ON public.questionnaire_answers
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "qa_update_own" ON public.questionnaire_answers;
CREATE POLICY "qa_update_own" ON public.questionnaire_answers
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "qa_delete_own" ON public.questionnaire_answers;
CREATE POLICY "qa_delete_own" ON public.questionnaire_answers
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- FAVORITES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, opportunity_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fav_select_own" ON public.favorites;
CREATE POLICY "fav_select_own" ON public.favorites
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "fav_insert_own" ON public.favorites;
CREATE POLICY "fav_insert_own" ON public.favorites
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "fav_delete_own" ON public.favorites;
CREATE POLICY "fav_delete_own" ON public.favorites
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- REPORTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE CASCADE,
  user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'ouvert' CHECK (status IN ('ouvert', 'en_cours', 'resolu', 'ferme')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_select_own_or_admin" ON public.reports;
CREATE POLICY "reports_select_own_or_admin" ON public.reports
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_editor_or_admin());

DROP POLICY IF EXISTS "reports_insert_any_user" ON public.reports;
CREATE POLICY "reports_insert_any_user" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "reports_update_editor" ON public.reports;
CREATE POLICY "reports_update_editor" ON public.reports
  FOR UPDATE TO authenticated
  USING (public.is_editor_or_admin())
  WITH CHECK (public.is_editor_or_admin());

DROP POLICY IF EXISTS "reports_delete_admin" ON public.reports;
CREATE POLICY "reports_delete_admin" ON public.reports
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============================================================
-- ADMIN_AUDIT_LOG
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_select_admin" ON public.admin_audit_log;
CREATE POLICY "audit_select_admin" ON public.admin_audit_log
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "audit_insert_editor" ON public.admin_audit_log;
CREATE POLICY "audit_insert_editor" ON public.admin_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (public.is_editor_or_admin());

-- ============================================================
-- SEED DATA: CATEGORIES
-- ============================================================

INSERT INTO public.categories (name, slug, description, sort_order) VALUES
  ('Bourses d''études', 'bourses-detudes', 'Bourses et financements pour poursuivre tes études', 1),
  ('Programmes d''échanges et de mobilité', 'echanges-mobilite', 'Programmes d''échange académique et de mobilité internationale', 2),
  ('Formations gratuites', 'formations-gratuites', 'Formations sans frais d''inscription', 3),
  ('Formations certifiantes', 'formations-certifiantes', 'Formations délivrant un certificat reconnu', 4),
  ('Concours et compétitions académiques', 'concours-competitions', 'Concours, olympiades et compétitions académiques', 5),
  ('Stages', 'stages', 'Stages professionnels et opportunités de pratique', 6),
  ('Programmes pour étudiants', 'programmes-etudiants', 'Programmes spécifiquement destinés aux étudiants', 7),
  ('Appels à candidatures', 'appels-candidatures', 'Appels à candidatures pour programmes et projets', 8),
  ('Développement de compétences', 'developpement-competences', 'Programmes de développement personnel et professionnel', 9),
  ('Autres opportunités éducatives', 'autres-opportunites', 'Autres opportunités éducatives diverses', 10)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SEED DATA: STUDY FIELDS
-- ============================================================

INSERT INTO public.study_fields (name, slug, sort_order) VALUES
  ('Sciences et technologies', 'sciences-technologies', 1),
  ('Informatique et numérique', 'informatique-numerique', 2),
  ('Ingénierie', 'ingenierie', 3),
  ('Santé et médecine', 'sante-medecine', 4),
  ('Économie et gestion', 'economie-gestion', 5),
  ('Entrepreneuriat', 'entrepreneuriat', 6),
  ('Droit et sciences politiques', 'droit-sciences-politiques', 7),
  ('Sciences humaines et sociales', 'sciences-humaines-sociales', 8),
  ('Arts et communication', 'arts-communication', 9),
  ('Agriculture et environnement', 'agriculture-environnement', 10),
  ('Autres domaines', 'autres-domaines', 11),
  ('Je ne sais pas encore', 'indecis', 12)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS categories_updated_at ON public.categories;
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS opportunities_updated_at ON public.opportunities;
CREATE TRIGGER opportunities_updated_at BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS videos_updated_at ON public.videos;
CREATE TRIGGER videos_updated_at BEFORE UPDATE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS reports_updated_at ON public.reports;
CREATE TRIGGER reports_updated_at BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();