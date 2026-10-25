/*
# NexusLab — sécuriser la propriété des signalements historiques

1. Changement
- Les signalements d'opportunités sont désormais créés avec `user_id` rempli par la session.
- Le navigateur ne peut plus fournir ou modifier directement l'identité du rapporteur.

2. Sécurité
- Retrait du droit d'insertion sur toutes les colonnes de `reports`.
- Autorisation d'insertion uniquement sur l'opportunité, le motif et les détails.
- La policy d'insertion vérifie que `user_id = auth.uid()`.

3. Compatibilité
- Les signalements existants restent inchangés.
- Aucun contenu n'est supprimé.
*/

REVOKE INSERT ON public.reports FROM authenticated;
GRANT INSERT (opportunity_id, reason, details) ON public.reports TO authenticated;
DROP POLICY IF EXISTS "reports_insert_any_user" ON public.reports;
CREATE POLICY "reports_insert_own" ON public.reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
