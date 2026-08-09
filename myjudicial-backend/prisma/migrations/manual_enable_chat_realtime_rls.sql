-- Manual Migration: Enable Supabase Realtime Authorization for chat conversation channels
-- Run this manually via the Supabase SQL Editor (see manual_add_notification_read_state.sql
-- for why this project uses hand-applied migrations for Supabase-specific changes — the
-- shared dev database has migration-history drift from untracked changes applied directly
-- against Supabase, so `prisma migrate dev` isn't usable here).
--
-- Gates who may RECEIVE broadcasts on a `conversation:{conversationId}` private channel
-- (topic format used by ChatBroadcastService on the backend). Does NOT touch
-- messages/conversation_participants table RLS — REST endpoints keep enforcing real
-- authorization regardless of what this policy does; a bug here only affects "can this
-- socket receive this broadcast," never actual data access via the REST API.
--
-- Verify against current Supabase Realtime Authorization docs before running:
--   1. Whether `realtime.messages` needs this explicit `enable row level security`,
--      or ships with it enabled already (harmless to run either way).
--   2. Whether current docs also want an `extension = 'broadcast'` check in the USING
--      clause, to avoid this same policy incidentally gating presence/postgres_changes
--      features on the same table.
--   3. Whether there's a separate project-level dashboard toggle for Realtime
--      Authorization independent of this SQL.
--
-- RLS defaults to deny-all once enabled, so an incomplete/wrong policy fails closed
-- (nobody receives broadcasts) rather than open. After running, verify manually: log in
-- as a user who is NOT a participant in a given conversation and confirm they receive
-- no events on that conversation's channel.

alter table "realtime"."messages" enable row level security;

create policy "chat: participants can receive conversation broadcasts"
on "realtime"."messages"
for select
to authenticated
using (
  exists (
    select 1
    from conversation_participants cp
    where cp."conversationId" = split_part(realtime.topic(), ':', 2)
      and cp."userId" = auth.uid()::text
      and cp."isActive" = true
  )
);

-- Verify the policy was created
SELECT policyname, tablename, cmd, qual
FROM pg_policies
WHERE schemaname = 'realtime' AND tablename = 'messages';
