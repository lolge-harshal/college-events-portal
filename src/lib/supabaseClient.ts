import { createClient } from '@supabase/supabase-js'

// Read environment variables from Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 Supabase Client Initialization:')
console.log('  URL:', supabaseUrl ? '✅ Loaded' : '❌ Missing')
console.log('  Key:', supabaseAnonKey ? '✅ Loaded' : '❌ Missing')

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase configuration error:')
    console.error('   VITE_SUPABASE_URL:', supabaseUrl || 'NOT SET')
    console.error('   VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'NOT SET')
    throw new Error(
        'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.'
    )
}

// Initialize and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('✅ Supabase client initialized successfully')

// Test connection and check RLS status on client initialization
setTimeout(async () => {
    try {
        const { error, status } = await supabase
            .from('events')
            .select('*', { count: 'exact', head: true })

        if (error) {
            if (status === 406) {
                console.error('⚠️ 406 Error detected - This usually means RLS policies are blocking queries!')
                console.error('   Details:', error.message)
                console.error('   Hint: Check your Supabase RLS policies for the "events" table')
            } else {
                console.error('⚠️ Supabase connection test failed:', {
                    status,
                    message: error.message,
                    code: error.code,
                })
            }
        } else {
            console.log('✅ Supabase connection test passed')
            console.log('ℹ️  RLS policies appear to be working correctly')
        }
    } catch (err: any) {
        console.error('❌ Supabase connection test error:', err.message)
    }
}, 500)