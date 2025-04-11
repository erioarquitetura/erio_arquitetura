import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Reuses the same configuration that's in the auto-generated client
const SUPABASE_URL = "https://kwlcofsbopfydilerggg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3bGNvZnNib3BmeWRpbGVyZ2dnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjAxMDMxMCwiZXhwIjoyMDU3NTg2MzEwfQ.BH2SXVq185HG6_MA-S6XS_6aows8mxmTjzsaBIYgNp4";

// Re-export the client for better type compatibility with the Database types
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export default supabase; 