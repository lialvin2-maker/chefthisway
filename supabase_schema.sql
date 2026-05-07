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
