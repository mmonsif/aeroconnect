
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vmteubfpwuiwzbncbikb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_sjhzB9wzTsjzBAI3t-zKJw_7Y5vcDcC';

// A helper to check if the Supabase client is likely to work
export const isSupabaseConfigured = () => {
  return supabaseUrl.length > 0 && 
         supabaseAnonKey.length > 0 && 
         !supabaseUrl.includes('your-project-url');
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * MASTER DATABASE RECREATION SCRIPT
 * ---------------------------------------------------------
 * DIRECTIONS: 
 * 1. Open your Supabase Dashboard.
 * 2. Go to "SQL Editor" -> "New Query".
 * 3. Paste the ENTIRE block below and click "Run".
 * ---------------------------------------------------------
 
-- 1. CLEAN SLATE: DROP OLD TABLES
DROP TABLE IF EXISTS public.forum_replies CASCADE;
DROP TABLE IF EXISTS public.forum_posts CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.leave_requests CASCADE;
DROP TABLE IF EXISTS public.safety_reports CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. CREATE USERS TABLE
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  username text UNIQUE NOT NULL,
  password text NOT NULL DEFAULT '123456',
  role text NOT NULL DEFAULT 'staff',
  staff_id text UNIQUE NOT NULL,
  avatar text,
  department text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  must_change_password boolean DEFAULT true,
  manager_id uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now()
);

-- 3. CREATE TASKS TABLE
CREATE TABLE public.tasks (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text,
  assigned_to text,
  status text NOT NULL DEFAULT 'pending',
  priority text NOT NULL DEFAULT 'medium',
  location text,
  department text,
  created_at timestamptz DEFAULT now()
);

-- 4. CREATE DOCUMENTS TABLE
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  uploaded_by text,
  file_path text,
  file_size bigint,
  created_at timestamptz DEFAULT now()
);

-- 5. CREATE SAFETY REPORTS TABLE
CREATE TABLE public.safety_reports (
  id text PRIMARY KEY,
  reporter_id text, 
  type text NOT NULL,
  description text NOT NULL,
  severity text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  ai_analysis text,
  entities jsonb,
  created_at timestamptz DEFAULT now()
);

-- 6. CREATE FORUM TABLES
CREATE TABLE public.forum_posts (
  id text PRIMARY KEY,
  author_id uuid REFERENCES public.users(id),
  author_name text,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.forum_replies (
  id text PRIMARY KEY,
  post_id text REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  author_name text,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 7. CREATE MESSAGES TABLE
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES public.users(id),
  recipient_id uuid REFERENCES public.users(id),
  sender_name text,
  text text NOT NULL,
  status text DEFAULT 'sent',
  created_at timestamptz DEFAULT now()
);

-- 8. CREATE LEAVE REQUESTS TABLE
CREATE TABLE public.leave_requests (
  id text PRIMARY KEY,
  staff_id text,
  staff_name text,
  type text NOT NULL,
  start_date text,
  end_date text,
  status text DEFAULT 'pending',
  reason text,
  suggestion text,
  suggested_start_date text,
  suggested_end_date text,
  created_at timestamptz DEFAULT now()
);

-- 9. INSERT SYSTEM BROADCAST USER (Crucial for Global Alerts)
INSERT INTO public.users (id, name, username, password, role, staff_id, department, status, must_change_password)
VALUES (
    '00000000-0000-0000-0000-000000000000', 
    'SYSTEM BROADCAST', 
    'system_alert', 
    'no-login-' || gen_random_uuid(), 
    'admin', 
    'SYSTEM-001', 
    'Management', 
    'active', 
    false
) ON CONFLICT (id) DO NOTHING;

-- 10. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- 11. CREATE "ALLOW ALL" POLICIES (For Development/Demo purposes)
CREATE POLICY "Public Access" ON public.users FOR ALL USING (true);
CREATE POLICY "Public Access" ON public.tasks FOR ALL USING (true);
CREATE POLICY "Public Access" ON public.documents FOR ALL USING (true);
CREATE POLICY "Public Access" ON public.safety_reports FOR ALL USING (true);
CREATE POLICY "Public Access" ON public.forum_posts FOR ALL USING (true);
CREATE POLICY "Public Access" ON public.forum_replies FOR ALL USING (true);
CREATE POLICY "Public Access" ON public.messages FOR ALL USING (true);
CREATE POLICY "Public Access" ON public.leave_requests FOR ALL USING (true);

-- 12. CONFIGURE REALTIME
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;

-- 13. INITIAL LOGIN CREDENTIALS (Admin / 123456)
INSERT INTO public.users (name, username, password, role, staff_id, department, status, must_change_password)
VALUES ('System Admin', 'admin', '123456', 'admin', 'ADM-001', 'Management', 'active', false)
ON CONFLICT (username) DO NOTHING;
*/
