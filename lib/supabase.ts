
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (window as any)._env_?.SUPABASE_URL || '';
const supabaseAnonKey = (window as any)._env_?.SUPABASE_ANON_KEY || '';

// A helper to check if the Supabase client is likely to work
export const isSupabaseConfigured = () => {
  return supabaseUrl !== '' && 
         supabaseAnonKey !== '' && 
         !supabaseUrl.includes('your-project-url');
};

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);

/**
 * DATABASE SCHEMA REQUIREMENTS:
 * 
 * Table: messages
 * Columns:
 * - id: uuid (Primary Key, default: gen_random_uuid())
 * - sender_id: text (ID of the staff who sent the message)
 * - recipient_id: text (ID of the staff receiving the message)
 * - sender_name: text (Display name of sender)
 * - text: text (The message content)
 * - status: text (default: 'sent', values: ['sent', 'delivered', 'read'])
 * - created_at: timestamptz (default: now())
 * 
 * Realtime: MUST be enabled for the 'messages' table in Supabase.
 */
