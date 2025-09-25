import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://gmtxmjhrwxuacwsrkbqt.supabase.co"; // substitua pela sua URL
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtdHhtamhyd3h1YWN3c3JrYnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MjcyMzYsImV4cCI6MjA3NDMwMzIzNn0.AL5jd1MhZwEVcz47ch-ay_u4qQRnKsx29G_sWlCdkSk";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
