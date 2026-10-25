/*
# NexusLab — parcours, discussions et modération communautaire

1. Objectif
- Ajouter un parcours d'apprentissage, une progression privée, des discussions sécurisées et des signalements communautaires.
- Préserver toutes les tables et données existantes.

2. Nouvelles tables
- learning_paths : parcours publiés ou gérés par les éditeurs.
- learning_path_steps : étapes ordonnées.
- learning_path_progress : progression privée de chaque utilisateur.
- hub_discussions et hub_discussion_posts : discussions générales, de club ou de projet.
- hub_reports : signalements des contenus communautaires.

3. Sécurité
- Parcours publiés lisibles publiquement et gestion réservée aux éditeurs.
- Progression, messages et signalements protégés par utilisateur et membership.
- Les auteurs peuvent modifier leurs propres messages ; les éditeurs peuvent modérer.
- Les propriétaires sont remplis par auth.uid() côté base.

4. Démonstration
- Un parcours complet de développement web et trois clubs francophones de démonstration sont ajoutés s'ils n'existent pas.

5. Compatibilité
- Aucune table existante n'est supprimée, renommée ou modifiée destructivement.
*/

CREATE TABLE IF NOT EXISTS public.learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text NOT NULL UNIQUE, title text NOT NULL,
  description text NOT NULL, objective text, starting_level text, target_level text,
  estimated_duration text, skills text[] NOT NULL DEFAULT '{}', is_published boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.learning_path_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), path_id uuid NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  sort_order int NOT NULL, title text NOT NULL, description text NOT NULL, resource_url text, exercise text,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (path_id, sort_order)
);
CREATE TABLE IF NOT EXISTS public.learning_path_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), path_id uuid NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  step_id uuid NOT NULL REFERENCES public.learning_path_steps(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'a_faire' CHECK (status IN ('a_faire', 'en_cours', 'terminee')),
  updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE (user_id, step_id)
);
CREATE INDEX IF NOT EXISTS idx_learning_steps_path_order ON public.learning_path_steps(path_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_learning_progress_user ON public.learning_path_progress(user_id, path_id);
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_progress ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.learning_paths, public.learning_path_steps TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.learning_paths, public.learning_path_steps TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_path_progress TO authenticated;
DROP POLICY IF EXISTS "learning_paths_select_published" ON public.learning_paths;
CREATE POLICY "learning_paths_select_published" ON public.learning_paths FOR SELECT TO anon, authenticated USING (is_published OR public.is_editor_or_admin());
DROP POLICY IF EXISTS "learning_paths_insert_editor" ON public.learning_paths;
CREATE POLICY "learning_paths_insert_editor" ON public.learning_paths FOR INSERT TO authenticated WITH CHECK (public.is_editor_or_admin());
DROP POLICY IF EXISTS "learning_paths_update_editor" ON public.learning_paths;
CREATE POLICY "learning_paths_update_editor" ON public.learning_paths FOR UPDATE TO authenticated USING (public.is_editor_or_admin()) WITH CHECK (public.is_editor_or_admin());
DROP POLICY IF EXISTS "learning_paths_delete_editor" ON public.learning_paths;
CREATE POLICY "learning_paths_delete_editor" ON public.learning_paths FOR DELETE TO authenticated USING (public.is_editor_or_admin());
DROP POLICY IF EXISTS "learning_steps_select_published" ON public.learning_path_steps;
CREATE POLICY "learning_steps_select_published" ON public.learning_path_steps FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.learning_paths p WHERE p.id = path_id AND (p.is_published OR public.is_editor_or_admin())));
DROP POLICY IF EXISTS "learning_steps_insert_editor" ON public.learning_path_steps;
CREATE POLICY "learning_steps_insert_editor" ON public.learning_path_steps FOR INSERT TO authenticated WITH CHECK (public.is_editor_or_admin());
DROP POLICY IF EXISTS "learning_steps_update_editor" ON public.learning_path_steps;
CREATE POLICY "learning_steps_update_editor" ON public.learning_path_steps FOR UPDATE TO authenticated USING (public.is_editor_or_admin()) WITH CHECK (public.is_editor_or_admin());
DROP POLICY IF EXISTS "learning_steps_delete_editor" ON public.learning_path_steps;
CREATE POLICY "learning_steps_delete_editor" ON public.learning_path_steps FOR DELETE TO authenticated USING (public.is_editor_or_admin());
DROP POLICY IF EXISTS "learning_progress_select_own" ON public.learning_path_progress;
CREATE POLICY "learning_progress_select_own" ON public.learning_path_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "learning_progress_insert_own" ON public.learning_path_progress;
CREATE POLICY "learning_progress_insert_own" ON public.learning_path_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.learning_path_steps s JOIN public.learning_paths p ON p.id = s.path_id WHERE s.id = step_id AND p.is_published));
DROP POLICY IF EXISTS "learning_progress_update_own" ON public.learning_path_progress;
CREATE POLICY "learning_progress_update_own" ON public.learning_path_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "learning_progress_delete_own" ON public.learning_path_progress;
CREATE POLICY "learning_progress_delete_own" ON public.learning_path_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.hub_discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, club_id uuid REFERENCES public.hub_clubs(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.hub_projects(id) ON DELETE CASCADE, created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CHECK (NOT (club_id IS NOT NULL AND project_id IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS public.hub_discussion_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), discussion_id uuid NOT NULL REFERENCES public.hub_discussions(id) ON DELETE CASCADE,
  parent_post_id uuid REFERENCES public.hub_discussion_posts(id) ON DELETE CASCADE, body text NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 4000),
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_discussions_context ON public.hub_discussions(club_id, project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussion_posts_thread ON public.hub_discussion_posts(discussion_id, created_at);
ALTER TABLE public.hub_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_discussion_posts ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hub_discussions, public.hub_discussion_posts TO authenticated;
DROP POLICY IF EXISTS "discussions_select_members" ON public.hub_discussions;
CREATE POLICY "discussions_select_members" ON public.hub_discussions FOR SELECT TO authenticated USING (
  (club_id IS NULL AND project_id IS NULL) OR public.is_editor_or_admin() OR auth.uid() = created_by
  OR EXISTS (SELECT 1 FROM public.hub_club_members m WHERE m.club_id = hub_discussions.club_id AND m.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.hub_project_members m WHERE m.project_id = hub_discussions.project_id AND m.user_id = auth.uid())
);
DROP POLICY IF EXISTS "discussions_insert_authenticated" ON public.hub_discussions;
CREATE POLICY "discussions_insert_authenticated" ON public.hub_discussions FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = created_by AND ((club_id IS NULL AND project_id IS NULL)
  OR EXISTS (SELECT 1 FROM public.hub_club_members m WHERE m.club_id = hub_discussions.club_id AND m.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.hub_project_members m WHERE m.project_id = hub_discussions.project_id AND m.user_id = auth.uid()))
);
DROP POLICY IF EXISTS "discussions_update_own_or_editor" ON public.hub_discussions;
CREATE POLICY "discussions_update_own_or_editor" ON public.hub_discussions FOR UPDATE TO authenticated USING (auth.uid() = created_by OR public.is_editor_or_admin()) WITH CHECK (auth.uid() = created_by OR public.is_editor_or_admin());
DROP POLICY IF EXISTS "discussions_delete_own_or_editor" ON public.hub_discussions;
CREATE POLICY "discussions_delete_own_or_editor" ON public.hub_discussions FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.is_editor_or_admin());
DROP POLICY IF EXISTS "discussion_posts_select_members" ON public.hub_discussion_posts;
CREATE POLICY "discussion_posts_select_members" ON public.hub_discussion_posts FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.hub_discussions d WHERE d.id = discussion_id AND ((d.club_id IS NULL AND d.project_id IS NULL) OR public.is_editor_or_admin() OR auth.uid() = d.created_by OR EXISTS (SELECT 1 FROM public.hub_club_members m WHERE m.club_id = d.club_id AND m.user_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.hub_project_members m WHERE m.project_id = d.project_id AND m.user_id = auth.uid()))));
DROP POLICY IF EXISTS "discussion_posts_insert_members" ON public.hub_discussion_posts;
CREATE POLICY "discussion_posts_insert_members" ON public.hub_discussion_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by AND EXISTS (SELECT 1 FROM public.hub_discussions d WHERE d.id = discussion_id AND ((d.club_id IS NULL AND d.project_id IS NULL) OR public.is_editor_or_admin() OR EXISTS (SELECT 1 FROM public.hub_club_members m WHERE m.club_id = d.club_id AND m.user_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.hub_project_members m WHERE m.project_id = d.project_id AND m.user_id = auth.uid()))));
DROP POLICY IF EXISTS "discussion_posts_update_own_or_editor" ON public.hub_discussion_posts;
CREATE POLICY "discussion_posts_update_own_or_editor" ON public.hub_discussion_posts FOR UPDATE TO authenticated USING (auth.uid() = created_by OR public.is_editor_or_admin()) WITH CHECK (auth.uid() = created_by OR public.is_editor_or_admin());
DROP POLICY IF EXISTS "discussion_posts_delete_own_or_editor" ON public.hub_discussion_posts;
CREATE POLICY "discussion_posts_delete_own_or_editor" ON public.hub_discussion_posts FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.is_editor_or_admin());

CREATE TABLE IF NOT EXISTS public.hub_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), entity_type text NOT NULL CHECK (entity_type IN ('club', 'project', 'gallery', 'discussion', 'post')),
  entity_id uuid NOT NULL, reporter_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (char_length(trim(reason)) BETWEEN 3 AND 120), details text,
  status text NOT NULL DEFAULT 'ouvert' CHECK (status IN ('ouvert', 'en_cours', 'resolu', 'ferme')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL, reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hub_reports ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hub_reports TO authenticated;
DROP POLICY IF EXISTS "hub_reports_select_own_or_editor" ON public.hub_reports;
CREATE POLICY "hub_reports_select_own_or_editor" ON public.hub_reports FOR SELECT TO authenticated USING (auth.uid() = reporter_id OR public.is_editor_or_admin());
DROP POLICY IF EXISTS "hub_reports_insert_own" ON public.hub_reports;
CREATE POLICY "hub_reports_insert_own" ON public.hub_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
DROP POLICY IF EXISTS "hub_reports_update_editor" ON public.hub_reports;
CREATE POLICY "hub_reports_update_editor" ON public.hub_reports FOR UPDATE TO authenticated USING (public.is_editor_or_admin()) WITH CHECK (public.is_editor_or_admin());
DROP POLICY IF EXISTS "hub_reports_delete_admin" ON public.hub_reports;
CREATE POLICY "hub_reports_delete_admin" ON public.hub_reports FOR DELETE TO authenticated USING (public.is_admin());

DROP TRIGGER IF EXISTS learning_paths_updated_at ON public.learning_paths;
CREATE TRIGGER learning_paths_updated_at BEFORE UPDATE ON public.learning_paths FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS learning_progress_updated_at ON public.learning_path_progress;
CREATE TRIGGER learning_progress_updated_at BEFORE UPDATE ON public.learning_path_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS hub_discussions_updated_at ON public.hub_discussions;
CREATE TRIGGER hub_discussions_updated_at BEFORE UPDATE ON public.hub_discussions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS hub_discussion_posts_updated_at ON public.hub_discussion_posts;
CREATE TRIGGER hub_discussion_posts_updated_at BEFORE UPDATE ON public.hub_discussion_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS hub_reports_updated_at ON public.hub_reports;
CREATE TRIGGER hub_reports_updated_at BEFORE UPDATE ON public.hub_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

INSERT INTO public.learning_paths (slug, title, description, objective, starting_level, target_level, estimated_duration, skills, is_published)
VALUES ('premiers-pas-developpement-web', 'Premiers pas en développement web', 'Un parcours progressif pour découvrir la logique, créer une première page et apprendre à présenter un projet.', 'Passer d une idée à une petite réalisation web documentée.', 'Débutant', 'Autonome sur un mini-projet', '7 séances', ARRAY['Logique', 'HTML', 'CSS', 'Travail en équipe', 'Présentation'], true)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.learning_path_steps (path_id, sort_order, title, description, exercise)
SELECT p.id, v.sort_order, v.title, v.description, v.exercise FROM public.learning_paths p CROSS JOIN (VALUES
  (1, 'Découvrir la logique et l algorithmique', 'Comprendre les étapes, les conditions et les répétitions.', 'Décrire l algorithme d une activité simple.'),
  (2, 'Apprendre les bases du web', 'Découvrir le rôle du HTML et du CSS.', 'Créer une page de présentation personnelle.'),
  (3, 'Réaliser des exercices simples', 'S entraîner avec de petits défis de mise en page et de logique.', 'Résoudre trois défis guidés.'),
  (4, 'Créer une réalisation en groupe', 'Choisir un besoin et construire une petite page avec son équipe.', 'Présenter une première version fonctionnelle.'),
  (5, 'Présenter le projet', 'Préparer une démonstration centrée sur les apprentissages.', 'Répéter une présentation de trois minutes.'),
  (6, 'Recevoir des retours', 'Échanger et identifier les points à améliorer.', 'Noter trois retours utiles.'),
  (7, 'Améliorer et documenter', 'Finaliser la réalisation et garder une trace du travail.', 'Publier une fiche projet.')
) AS v(sort_order, title, description, exercise) WHERE p.slug = 'premiers-pas-developpement-web' ON CONFLICT (path_id, sort_order) DO NOTHING;
INSERT INTO public.hub_clubs (name, slug, description, mission, skills_developed, status) VALUES
  ('Atelier Code & Web', 'atelier-code-web', 'Club de démonstration pour apprendre à créer des pages web.', 'Apprendre en construisant des projets utiles.', 'Logique, programmation, collaboration', 'actif'),
  ('Orientation & Métiers d avenir', 'orientation-metiers-avenir', 'Club de démonstration pour découvrir des secteurs et parcours.', 'Mieux comprendre les possibilités scolaires et professionnelles.', 'Recherche, expression, orientation', 'actif'),
  ('Objectif Bac', 'objectif-bac', 'Club de démonstration pour s organiser et réviser ensemble.', 'Progresser avec des méthodes simples et de l entraide.', 'Organisation, révision, entraide', 'actif')
ON CONFLICT (slug) DO NOTHING;
