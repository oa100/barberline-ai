-- RLS policies for Clerk + Supabase third-party auth integration
-- Uses auth.jwt()->>'sub' to extract the Clerk user ID from the session token

-- SHOPS: users can CRUD their own shop
create policy "Users can view their own shop"
  on shops for select to authenticated
  using ((select auth.jwt()->>'sub') = clerk_user_id);

create policy "Users can create their own shop"
  on shops for insert to authenticated
  with check ((select auth.jwt()->>'sub') = clerk_user_id);

create policy "Users can update their own shop"
  on shops for update to authenticated
  using ((select auth.jwt()->>'sub') = clerk_user_id);

-- TEAM MEMBERS: users can manage team members for their own shop
create policy "Users can view their shop team members"
  on team_members for select to authenticated
  using (shop_id in (select id from shops where clerk_user_id = (select auth.jwt()->>'sub')));

create policy "Users can manage their shop team members"
  on team_members for all to authenticated
  using (shop_id in (select id from shops where clerk_user_id = (select auth.jwt()->>'sub')));

-- CALL LOGS: users can view call logs for their own shop
create policy "Users can view their shop call logs"
  on call_logs for select to authenticated
  using (shop_id in (select id from shops where clerk_user_id = (select auth.jwt()->>'sub')));

create policy "Users can insert call logs for their shop"
  on call_logs for insert to authenticated
  with check (shop_id in (select id from shops where clerk_user_id = (select auth.jwt()->>'sub')));

-- BOOKINGS: users can view and manage bookings for their own shop
create policy "Users can view their shop bookings"
  on bookings for select to authenticated
  using (shop_id in (select id from shops where clerk_user_id = (select auth.jwt()->>'sub')));

create policy "Users can insert bookings for their shop"
  on bookings for insert to authenticated
  with check (shop_id in (select id from shops where clerk_user_id = (select auth.jwt()->>'sub')));

create policy "Users can update their shop bookings"
  on bookings for update to authenticated
  using (shop_id in (select id from shops where clerk_user_id = (select auth.jwt()->>'sub')));
