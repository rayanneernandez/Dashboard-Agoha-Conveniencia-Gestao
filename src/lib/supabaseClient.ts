import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gmtxmjhrwxuacwsrkbqt.supabase.co' //  URL do projeto
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // chave anon public

export const supabase = createClient(supabaseUrl, supabaseKey)
