-- ============================================================
-- ChefThisWay — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. PROFILES (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name     TEXT,
  avatar_url    TEXT,
  bio           TEXT,
  phone         TEXT,
  location_name TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on first sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. FOOD POSTS
CREATE TABLE IF NOT EXISTS food_posts (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id      UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  seller_name    TEXT,
  seller_photo   TEXT,
  title          TEXT NOT NULL,
  description    TEXT,
  price          DECIMAL(10,2) DEFAULT 0,
  photos         TEXT[],
  videos         TEXT[],
  category       TEXT CHECK (category IN ('bakery','hot_mains','snacks','beverages','desserts','salads','other')),
  tags           TEXT[],
  location_name  TEXT,
  location_lat   FLOAT,
  location_lng   FLOAT,
  likes_count    INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  reviews_count  INTEGER DEFAULT 0,
  is_boosted        BOOLEAN DEFAULT FALSE,
  requires_license  BOOLEAN DEFAULT FALSE,  -- Canadian food safety: licensed items show "Please contact" price
  status            TEXT DEFAULT 'active' CHECK (status IN ('active','sold','deleted')),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CONVERSATIONS
CREATE TABLE IF NOT EXISTS conversations (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id        UUID REFERENCES profiles(id),
  seller_id       UUID REFERENCES profiles(id),
  post_id         UUID REFERENCES food_posts(id),
  buyer_name      TEXT,
  seller_name     TEXT,
  last_message    TEXT,
  last_message_at TIMESTAMPTZ,
  unread_buyer    INTEGER DEFAULT 0,
  unread_seller   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MESSAGES
CREATE TABLE IF NOT EXISTS messages (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id       UUID REFERENCES profiles(id),
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BOOKMARKS
CREATE TABLE IF NOT EXISTS bookmarks (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id    UUID REFERENCES food_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- 6. LIKES
CREATE TABLE IF NOT EXISTS likes (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id    UUID REFERENCES food_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- 7. REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id  UUID REFERENCES profiles(id),
  post_id      UUID REFERENCES food_posts(id) ON DELETE CASCADE,
  seller_id    UUID REFERENCES profiles(id),
  rating       INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_posts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews      ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, own write
CREATE POLICY "profiles_public_read"  ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_own_write"    ON profiles FOR ALL   USING (auth.uid() = id);

-- Food posts: public read, seller write
CREATE POLICY "posts_public_read"     ON food_posts FOR SELECT USING (status != 'deleted');
CREATE POLICY "posts_seller_insert"   ON food_posts FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "posts_seller_update"   ON food_posts FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "posts_seller_delete"   ON food_posts FOR DELETE USING (auth.uid() = seller_id);

-- Conversations: participants only
CREATE POLICY "conv_participants"     ON conversations FOR ALL
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Messages: participants of conversation
CREATE POLICY "msg_participants"      ON messages FOR ALL
  USING (EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
  ));

-- Bookmarks/Likes: own rows
CREATE POLICY "bookmarks_own"         ON bookmarks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "likes_own"             ON likes     FOR ALL USING (auth.uid() = user_id);

-- Reviews: public read, own insert
CREATE POLICY "reviews_public_read"   ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_own_insert"    ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- ============================================================
-- STORAGE BUCKETS
-- Create these in: Supabase Dashboard → Storage → New Bucket
-- ============================================================
-- Bucket name: food-photos    | Public: YES
-- Bucket name: avatars        | Public: YES

-- ============================================================
-- 2026-10-26: food_posts RLS was found switched OFF in the live project.
-- Turn it on, and let the database keep likes_count in sync, because
-- non-owners can no longer update food_posts from the browser.
-- ============================================================
ALTER TABLE food_posts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION sync_likes_count() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE food_posts
     SET likes_count = (SELECT count(*) FROM likes WHERE post_id = COALESCE(NEW.post_id, OLD.post_id))
   WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS likes_count_sync ON likes;
CREATE TRIGGER likes_count_sync AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION sync_likes_count();

UPDATE food_posts p SET likes_count = (SELECT count(*) FROM likes l WHERE l.post_id = p.id);

-- ============================================================
-- 2026-10-29: App Store rules 1.2 and 5.1.1(v).
-- Users can report listings/users, block users, and delete their account.
-- ============================================================

-- Reports: anyone signed in can file one; only the owner reads them in the dashboard.
CREATE TABLE IF NOT EXISTS reports (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  post_id          UUID REFERENCES food_posts(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason           TEXT NOT NULL,
  details          TEXT,
  status           TEXT NOT NULL DEFAULT 'open',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  CHECK (post_id IS NOT NULL OR reported_user_id IS NOT NULL)
);
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reports_own_insert" ON reports;
CREATE POLICY "reports_own_insert" ON reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Blocks: each user sees and edits only their own list.
CREATE TABLE IF NOT EXISTS blocks (
  blocker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "blocks_own" ON blocks;
CREATE POLICY "blocks_own" ON blocks FOR ALL TO authenticated
  USING (auth.uid() = blocker_id) WITH CHECK (auth.uid() = blocker_id);

-- A block in either direction stops new chats and new messages between the two users.
CREATE OR REPLACE FUNCTION is_blocked_between(a UUID, b UUID) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM blocks
                  WHERE (blocker_id = a AND blocked_id = b) OR (blocker_id = b AND blocked_id = a));
$$;
REVOKE ALL ON FUNCTION is_blocked_between(UUID, UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION enforce_no_block() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c conversations%ROWTYPE;
BEGIN
  IF TG_TABLE_NAME = 'conversations' THEN
    IF is_blocked_between(NEW.buyer_id, NEW.seller_id) THEN
      RAISE EXCEPTION 'blocked' USING ERRCODE = 'P0001';
    END IF;
  ELSE
    SELECT * INTO c FROM conversations WHERE id = NEW.conversation_id;
    IF is_blocked_between(c.buyer_id, c.seller_id) THEN
      RAISE EXCEPTION 'blocked' USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS conversations_no_block ON conversations;
CREATE TRIGGER conversations_no_block BEFORE INSERT ON conversations
  FOR EACH ROW EXECUTE FUNCTION enforce_no_block();
DROP TRIGGER IF EXISTS messages_no_block ON messages;
CREATE TRIGGER messages_no_block BEFORE INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION enforce_no_block();

-- Account deletion. conversations, messages.sender_id and reviews have no
-- ON DELETE CASCADE, so clear them first; deleting auth.users then cascades
-- to profiles -> food_posts, likes, bookmarks, blocks.
CREATE OR REPLACE FUNCTION delete_my_account() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;

  DELETE FROM conversations
   WHERE buyer_id = uid OR seller_id = uid
      OR post_id IN (SELECT id FROM food_posts WHERE seller_id = uid);
  DELETE FROM messages WHERE sender_id = uid;
  DELETE FROM reviews
   WHERE reviewer_id = uid OR seller_id = uid
      OR post_id IN (SELECT id FROM food_posts WHERE seller_id = uid);
  DELETE FROM auth.users WHERE id = uid;
END $$;

REVOKE ALL ON FUNCTION delete_my_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION delete_my_account() TO authenticated;
