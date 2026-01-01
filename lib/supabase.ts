
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://vmteubfpwuiwzbncbikb.supabase.co';
const supabaseAnonKey = 'sb_publishable_sjhzB9wzTsjzBAI3t-zKJw_7Y5vcDcC';

// A helper to check if the Supabase client is likely to work
// Using .length to avoid "types have no overlap" comparison errors with specific string literals
export const isSupabaseConfigured = () => {
  return supabaseUrl.length > 0 && 
         supabaseAnonKey.length > 0 && 
         !supabaseUrl.includes('your-project-url');
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
