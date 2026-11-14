-- =====================================================================
-- Youth Alpha — update 9: feedback can never be deleted (not even by admins). Safe to re-run.
-- =====================================================================
drop policy if exists staff_delete on public.feedback;
revoke delete on public.feedback from anon, authenticated;
