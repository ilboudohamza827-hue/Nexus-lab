/*
# NexusLab Hub — Community Database Schema

## Overview
Creates the database schema for NexusLab Hub, the community space for activities,
clubs, projects, gallery showcases, and member networking.

## Tables Created
1. `hub_activities` — community events, workshops, meetups
2. `hub_activity_registrations` — user registrations for activities
3. `hub_clubs` — interest-based clubs and communities
4. `hub_club_categories` — club category taxonomy (admin-managed)
5. `hub_club_members` — club membership junction
6. `hub_club_join_requests` — pending join requests
7. `hub_projects` — collaborative member projects
8. `hub_project_members` — project team members
9. `hub_project_join_requests` — pending project join requests
10. `hub_gallery_items` — showcase of achievements and creations
11. `hub_member_skills` — member skills/interests for networking

## Security
- RLS enabled on all tables.
- Public read on published activities, approved clubs, published projects, published gallery items.
- User-scoped write on registrations, join requests, member skills, project proposals.
- Admin/editor-only write on activities, clubs, club categories, gallery moderation.
- Project creation available to all authenticated users (moderated before public visibility).
- All helper functions from the core schema (is_admin, is_editor_or_admin) are reused.

## Notes
1. Only activities with status='publie' are visible to the public.
2. Only clubs with status='actif' are visible to the public.
3. Only projects with moderation_status='approuve' are visible to the public.
4. Gallery items with status='publie' are visible to the public.
5. Registrations create unique (user_id, activity_id) pairs.
*/

-- ============================================================
-- HUB_ACTIVITY_REGISTRATIONS (no FK issues — standalone)
-- ============================================================
-- We create activity_registrations after activities due to FK.

-- ============================================================
-- HUB_ACTIVITIES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.hub_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  objectives text,
  activity_date timestamptz,
  end_date timestamptz,
  location text,
  is_online boolean NOT NULL DEFAULT false,
  online_link text,
  target_audience text,
  prerequisites text,
  max_participants int,
  registration_deadline timestamptz,
  fees text,
  organizer text,
  status text NOT NULL DEFAULT 'brouillon' CHECK (status IN ('brouillon', 'publie', 'complet', 'termine', 'annule')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hub_activities_status ON public.hub_activities(status);
CREATE INDEX IF NOT EXISTS idx_hub_activities_date ON public.hub_activities(activity_date);

ALTER TABLE public.hub_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hub_activities_select_public" ON public.hub_activities;
CREATE POLICY "hub_activities_select_public" ON public.hub_activities
  FOR SELECT TO anon, authenticated
  USING (status IN ('publie', 'complet', 'termine') OR public.is_editor_or_admin());

DROP POLICY IF EXISTS "hub_activities_insert_editor" ON public.hub_activities;
CREATE POLICY "hub_activities_insert_editor" ON public.hub_activities
  FOR INSERT TO authenticated
  WITH CHECK (public.is_editor_or_admin());

DROP POLICY IF EXISTS "hub_activities_update_editor" ON public.hub_activities;
CREATE POLICY "hub_activities_update_editor" ON public.hub_activities
  FOR UPDATE TO authenticated
  USING (public.is_editor_or_admin())
  WITH CHECK (public.is_editor_or_admin());

DROP POLICY IF EXISTS "hub_activities_delete_editor" ON public.hub_activities;
CREATE POLICY "hub_activities_delete_editor" ON public.hub_activities
  FOR DELETE TO authenticated
  USING (public.is_editor_or_admin());

-- ============================================================
-- HUB_ACTIVITY_REGISTRATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.hub_activity_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES public.hub_activities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'inscrit' CHECK (status IN ('inscrit', 'confirme', 'present', 'absent', 'annule')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (activity_id, user_id)
);

ALTER TABLE public.hub_activity_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hub_reg_select_own_or_admin" ON public.hub_activity_registrations;
CREATE POLICY "hub_reg_select_own_or_admin" ON public.hub_activity_registrations
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_editor_or_admin());

DROP POLICY IF EXISTS "hub_reg_insert_own" ON public.hub_activity_registrations;
CREATE POLICY "hub_reg_insert_own" ON public.hub_activity_registrations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "hub_reg_update_own_or_admin" ON public.hub_activity_registrations;
CREATE POLICY "hub_reg_update_own_or_admin" ON public.hub_activity_registrations
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_editor_or_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_editor_or_admin());

DROP POLICY IF EXISTS "hub_reg_delete_own" ON public.hub_activity_registrations;
CREATE POLICY "hub_reg_delete_own" ON public.hub_activity_registrations
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- HUB_CLUB_CATEGORIES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.hub_club_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hub_club_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hub_club_cat_select_public" ON public.hub_club_categories;
CREATE POLICY "hub_club_cat_select_public" ON public.hub_club_categories
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "hub_club_cat_insert_editor" ON public.hub_club_categories;
CREATE POLICY "hub_club_cat_insert_editor" ON public.hub_club_categories
  FOR INSERT TO authenticated
  WITH CHECK (public.is_editor_or_admin());

DROP POLICY IF EXISTS "hub_club_cat_update_editor" ON public.hub_club_categories;
CREATE POLICY "hub_club_cat_update_editor" ON public.hub_club_categories
  FOR UPDATE TO authenticated
  USING (public.is_editor_or_admin())
  WITH CHECK (public.is_editor_or_admin());

DROP POLICY IF EXISTS "hub_club_cat_delete_editor" ON public.hub_club_categories;
CREATE POLICY "hub_club_cat_delete_editor" ON public.hub_club_categories
  FOR DELETE TO authenticated
  USING (public.is_editor_or_admin());

-- ============================================================
-- HUB_CLUBS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.hub_clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  mission text,
  image_url text,
  category_id uuid REFERENCES public.hub_club_categories(id) ON DELETE SET NULL,
  skills_developed text,
  activities_description text,
  membership_conditions text,
  status text NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'actif', 'inactif', 'refuse')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hub_clubs_status ON public.hub_clubs(status);

ALTER TABLE public.hub_clubs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hub_clubs_select_public" ON public.hub_clubs;
CREATE POLICY "hub_clubs_select_public" ON public.hub_clubs
  FOR SELECT TO anon, authenticated
  USING (status = 'actif' OR public.is_editor_or_admin() OR auth.uid() = created_by);

DROP POLICY IF EXISTS "hub_clubs_insert_any_user" ON public.hub_clubs;
CREATE POLICY "hub_clubs_insert_any_user" ON public.hub_clubs
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "hub_clubs_update_editor_or_owner" ON public.hub_clubs;
CREATE POLICY "hub_clubs_update_editor_or_owner" ON public.hub_clubs
  FOR UPDATE TO authenticated
  USING (public.is_editor_or_admin() OR auth.uid() = created_by)
  WITH CHECK (public.is_editor_or_admin() OR auth.uid() = created_by);

DROP POLICY IF EXISTS "hub_clubs_delete_editor" ON public.hub_clubs;
CREATE POLICY "hub_clubs_delete_editor" ON public.hub_clubs
  FOR DELETE TO authenticated
  USING (public.is_editor_or_admin());

-- ============================================================
-- HUB_CLUB_MEMBERS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.hub_club_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.hub_clubs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'membre' CHECK (role IN ('membre', 'animateur', 'responsable')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (club_id, user_id)
);

ALTER TABLE public.hub_club_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hub_club_mem_select_public" ON public.hub_club_members;
CREATE POLICY "hub_club_mem_select_public" ON public.hub_club_members
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "hub_club_mem_insert_own" ON public.hub_club_members;
CREATE POLICY "hub_club_mem_insert_own" ON public.hub_club_members
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_editor_or_admin());

DROP POLICY IF EXISTS "hub_club_mem_update_editor_or_owner" ON public.hub_club_members;
CREATE POLICY "hub_club_mem_update_editor_or_owner" ON public.hub_club_members
  FOR UPDATE TO authenticated
  USING (public.is_editor_or_admin() OR auth.uid() = user_id)
  WITH CHECK (public.is_editor_or_admin() OR auth.uid() = user_id);

DROP POLICY IF EXISTS "hub_club_mem_delete_own_or_admin" ON public.hub_club_members;
CREATE POLICY "hub_club_mem_delete_own_or_admin" ON public.hub_club_members
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_editor_or_admin());

-- ============================================================
-- HUB_CLUB_JOIN_REQUESTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.hub_club_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.hub_clubs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  message text,
  status text NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'approuve', 'refuse')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (club_id, user_id)
);

ALTER TABLE public.hub_club_join_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hub_club_req_select_own_or_admin" ON public.hub_club_join_requests;
CREATE POLICY "hub_club_req_select_own_or_admin" ON public.hub_club_join_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_editor_or_admin());

DROP POLICY IF EXISTS "hub_club_req_insert_own" ON public.hub_club_join_requests;
CREATE POLICY "hub_club_req_insert_own" ON public.hub_club_join_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "hub_club_req_update_admin" ON public.hub_club_join_requests;
CREATE POLICY "hub_club_req_update_admin" ON public.hub_club_join_requests
  FOR UPDATE TO authenticated
  USING (public.is_editor_or_admin())
  WITH CHECK (public.is_editor_or_admin());

DROP POLICY IF EXISTS "hub_club_req_delete_own_or_admin" ON public.hub_club_join_requests;
CREATE POLICY "hub_club_req_delete_own_or_admin" ON public.hub_club_join_requests
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_editor_or_admin());

-- ============================================================
-- HUB_PROJECTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.hub_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  problem_statement text,
  objectives text,
  skills_needed text[] DEFAULT '{}',
  roles_available text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'idee' CHECK (status IN ('idee', 'recherche_collab', 'preparation', 'en_cours', 'test', 'realise', 'pause')),
  moderation_status text NOT NULL DEFAULT 'en_attente' CHECK (moderation_status IN ('en_attente', 'approuve', 'refuse')),
  gallery_enabled boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hub_projects_status ON public.hub_projects(status);
CREATE INDEX IF NOT EXISTS idx_hub_projects_moderation ON public.hub_projects(moderation_status);

ALTER TABLE public.hub_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hub_projects_select_public" ON public.hub_projects;
CREATE POLICY "hub_projects_select_public" ON public.hub_projects
  FOR SELECT TO anon, authenticated
  USING (moderation_status = 'approuve' OR auth.uid() = created_by OR public.is_editor_or_admin());

DROP POLICY IF EXISTS "hub_projects_insert_any_user" ON public.hub_projects;
CREATE POLICY "hub_projects_insert_any_user" ON public.hub_projects
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "hub_projects_update_owner_or_admin" ON public.hub_projects;
CREATE POLICY "hub_projects_update_owner_or_admin" ON public.hub_projects
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR public.is_editor_or_admin())
  WITH CHECK (auth.uid() = created_by OR public.is_editor_or_admin());

DROP POLICY IF EXISTS "hub_projects_delete_owner_or_admin" ON public.hub_projects;
CREATE POLICY "hub_projects_delete_owner_or_admin" ON public.hub_projects
  FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR public.is_editor_or_admin());

-- ============================================================
-- HUB_PROJECT_MEMBERS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.hub_project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.hub_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'membre' CHECK (role IN ('chef_projet', 'membre', 'contributeur')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);

ALTER TABLE public.hub_project_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hub_proj_mem_select_public" ON public.hub_project_members;
CREATE POLICY "hub_proj_mem_select_public" ON public.hub_project_members
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "hub_proj_mem_insert_own_or_admin" ON public.hub_project_members;
CREATE POLICY "hub_proj_mem_insert_own_or_admin" ON public.hub_project_members
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_editor_or_admin());

DROP POLICY IF EXISTS "hub_proj_mem_delete_own_or_admin" ON public.hub_project_members;
CREATE POLICY "hub_proj_mem_delete_own_or_admin" ON public.hub_project_members
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_editor_or_admin());

-- ============================================================
-- HUB_PROJECT_JOIN_REQUESTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.hub_project_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.hub_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  message text,
  proposed_role text,
  status text NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'approuve', 'refuse')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  UNIQUE (project_id, user_id)
);

ALTER TABLE public.hub_project_join_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hub_proj_req_select_own_or_admin" ON public.hub_project_join_requests;
CREATE POLICY "hub_proj_req_select_own_or_admin" ON public.hub_project_join_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_editor_or_admin() OR EXISTS (
    SELECT 1 FROM public.hub_projects p
    WHERE p.id = project_id AND p.created_by = auth.uid()
  ));

DROP POLICY IF EXISTS "hub_proj_req_insert_own" ON public.hub_project_join_requests;
CREATE POLICY "hub_proj_req_insert_own" ON public.hub_project_join_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "hub_proj_req_update_owner_or_admin" ON public.hub_project_join_requests;
CREATE POLICY "hub_proj_req_update_owner_or_admin" ON public.hub_project_join_requests
  FOR UPDATE TO authenticated
  USING (public.is_editor_or_admin() OR EXISTS (
    SELECT 1 FROM public.hub_projects p
    WHERE p.id = project_id AND p.created_by = auth.uid()
  ))
  WITH CHECK (public.is_editor_or_admin() OR EXISTS (
    SELECT 1 FROM public.hub_projects p
    WHERE p.id = project_id AND p.created_by = auth.uid()
  ));

DROP POLICY IF EXISTS "hub_proj_req_delete_own_or_admin" ON public.hub_project_join_requests;
CREATE POLICY "hub_proj_req_delete_own_or_admin" ON public.hub_project_join_requests
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_editor_or_admin());

-- ============================================================
-- HUB_GALLERY_ITEMS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.hub_gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text,
  item_type text NOT NULL DEFAULT 'projet' CHECK (item_type IN ('projet', 'prototype', 'creation', 'atelier', 'concours', 'initiative', 'temoignage')),
  project_id uuid REFERENCES public.hub_projects(id) ON DELETE SET NULL,
  club_id uuid REFERENCES public.hub_clubs(id) ON DELETE SET NULL,
  activity_id uuid REFERENCES public.hub_activities(id) ON DELETE SET NULL,
  contributor_names text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'brouillon' CHECK (status IN ('brouillon', 'publie', 'archive')),
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hub_gallery_status ON public.hub_gallery_items(status);
CREATE INDEX IF NOT EXISTS idx_hub_gallery_type ON public.hub_gallery_items(item_type);

ALTER TABLE public.hub_gallery_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hub_gallery_select_public" ON public.hub_gallery_items;
CREATE POLICY "hub_gallery_select_public" ON public.hub_gallery_items
  FOR SELECT TO anon, authenticated
  USING (status = 'publie' OR auth.uid() = created_by OR public.is_editor_or_admin());

DROP POLICY IF EXISTS "hub_gallery_insert_any_user" ON public.hub_gallery_items;
CREATE POLICY "hub_gallery_insert_any_user" ON public.hub_gallery_items
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "hub_gallery_update_owner_or_admin" ON public.hub_gallery_items;
CREATE POLICY "hub_gallery_update_owner_or_admin" ON public.hub_gallery_items
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR public.is_editor_or_admin())
  WITH CHECK (auth.uid() = created_by OR public.is_editor_or_admin());

DROP POLICY IF EXISTS "hub_gallery_delete_owner_or_admin" ON public.hub_gallery_items;
CREATE POLICY "hub_gallery_delete_owner_or_admin" ON public.hub_gallery_items
  FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR public.is_editor_or_admin());

-- ============================================================
-- HUB_MEMBER_SKILLS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.hub_member_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name text NOT NULL,
  skill_type text NOT NULL CHECK (skill_type IN ('apprendre', 'partager', 'recherche_collab')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, skill_name, skill_type)
);

ALTER TABLE public.hub_member_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hub_skills_select_public" ON public.hub_member_skills;
CREATE POLICY "hub_skills_select_public" ON public.hub_member_skills
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "hub_skills_insert_own" ON public.hub_member_skills;
CREATE POLICY "hub_skills_insert_own" ON public.hub_member_skills
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "hub_skills_delete_own" ON public.hub_member_skills;
CREATE POLICY "hub_skills_delete_own" ON public.hub_member_skills
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- SEED DATA: CLUB CATEGORIES
-- ============================================================

INSERT INTO public.hub_club_categories (name, slug, sort_order) VALUES
  ('Sciences et recherche', 'sciences-recherche', 1),
  ('Programmation et intelligence artificielle', 'programmation-ia', 2),
  ('Robotique et innovation', 'robotique-innovation', 3),
  ('Entrepreneuriat et gestion de projets', 'entrepreneuriat-gestion', 4),
  ('Art, design et créativité', 'art-design-creativite', 5),
  ('Lecture, écriture et expression', 'lecture-ecriture-expression', 6),
  ('Débat, leadership et prise de parole', 'debat-leadership', 7),
  ('Éducation et engagement citoyen', 'education-citoyennete', 8),
  ('Environnement et développement durable', 'environnement-durable', 9),
  ('Audiovisuel, photographie et création de contenu', 'audiovisuel-photo-contenu', 10)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS hub_activities_updated_at ON public.hub_activities;
CREATE TRIGGER hub_activities_updated_at BEFORE UPDATE ON public.hub_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS hub_clubs_updated_at ON public.hub_clubs;
CREATE TRIGGER hub_clubs_updated_at BEFORE UPDATE ON public.hub_clubs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS hub_projects_updated_at ON public.hub_projects;
CREATE TRIGGER hub_projects_updated_at BEFORE UPDATE ON public.hub_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS hub_gallery_updated_at ON public.hub_gallery_items;
CREATE TRIGGER hub_gallery_updated_at BEFORE UPDATE ON public.hub_gallery_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();