// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://kwlcofsbopfydilerggg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3bGNvZnNib3BmeWRpbGVyZ2dnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjAxMDMxMCwiZXhwIjoyMDU3NTg2MzEwfQ.BH2SXVq185HG6_MA-S6XS_6aows8mxmTjzsaBIYgNp4";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// Estamos usando Database de ./types.ts
// Para adicionar os tipos de usuários e permissões, veja o arquivo ./types.ts
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);


