-- Makes the friend word meaningful (design doc §11): items in locked
-- categories, and friends-only prints, stop being readable with the public
-- anon key. The world fetches them through a server action that checks the
-- friend cookie and reads with the service-role client instead.
--
-- Run AFTER deploying the world branch: the current site reads cooking
-- items with the anon key, so applying this first would empty its Food
-- chapter for friends.

drop policy if exists "public_read_published" on gallery_items;

create policy "public_read_published" on gallery_items for select using (
  status = 'published'
  and friends_only = false
  and not exists (
    select 1 from categories c where c.id = gallery_items.category_id and c.is_locked
  )
);
