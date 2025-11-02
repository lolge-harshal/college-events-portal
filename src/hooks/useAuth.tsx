import { useState, useEffect, useContext, createContext, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { withTimeout } from '../lib/queryTimeout'

/**
 * Profile interface extends user data from Supabase
 * Maps to the 'profiles' table in the database
 */
export interface Profile {
    id: string
    email: string
    full_name: string
    role: 'student' | 'organizer' | 'admin'
    is_admin: boolean
    created_at: string
    updated_at: string
}

/**
 * AuthContext interface defines the shape of auth state
 */
export interface AuthContextType {
    user: User | null
    profile: Profile | null
    loading: boolean
    error: string | null
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>
    signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>
    signOut: () => Promise<{ error: Error | null }>
    resetError: () => void
}

// Create the Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * AuthProvider component wraps the app and provides auth state globally
 * Usage: Wrap your App with <AuthProvider>
 */
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Track profile fetch attempts to prevent infinite retries
    const [fetchAttempts, setFetchAttempts] = useState<Map<string, number>>(new Map())
    const MAX_FETCH_ATTEMPTS = 3  // Increased from 2 to 3 for better reliability

    // Track if profile fetch is in progress to prevent simultaneous fetches
    const [isFetching, setIsFetching] = useState(false)
    const [lastAuthEvent, setLastAuthEvent] = useState<string | null>(null)

    /**
     * Fetch user profile from the 'profiles' table
     * Called when user logs in or component mounts
     */
    async function fetchProfile(userId: string) {
        try {
            // Prevent simultaneous fetches for the same user
            if (isFetching) {
                console.log('⏳ Profile fetch already in progress, skipping duplicate request')
                return
            }

            // Check if we've already tried too many times for this user
            const attempts = fetchAttempts.get(userId) || 0
            if (attempts >= MAX_FETCH_ATTEMPTS) {
                console.warn(`⚠️ Profile fetch already attempted ${attempts} times for user ${userId}. Giving up.`)
                setProfile(null)
                return
            }

            // Mark as fetching
            setIsFetching(true)

            // Increment attempt counter
            setFetchAttempts(prev => new Map(prev).set(userId, attempts + 1))

            console.log(`🔄 Fetching profile for user: ${userId} (attempt ${attempts + 1}/${MAX_FETCH_ATTEMPTS})`)

            // Add timeout to prevent hanging
            const { data, error, status } = await withTimeout<Profile>(
                supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single(),
                15000 // Increased timeout to 15s for Supabase cold start & network delays
            )

            if (error) {
                console.error('❌ Profile fetch error:', {
                    message: error.message,
                    code: error.code,
                    status: status,
                    details: error.details,
                    hint: error.hint,
                })

                // If we get a 500 error with infinite recursion, it's RLS policies
                if (status === 500 && error.message.includes('infinite recursion')) {
                    console.error('💡 DIAGNOSTIC: 500 Error - Infinite recursion in RLS policies detected')
                    console.error('   This is a database configuration issue, not your code')
                    console.error('   Fix: Go to Supabase dashboard and disable RLS or fix policies')
                    console.error('   See: DISABLE_RLS_NOW.sql for quick fix')

                    // Set profile to null but don't throw - allow app to continue
                    setProfile(null)
                    setIsFetching(false)
                    return
                }

                // If we get a 406 error, it's likely RLS is blocking access
                if (status === 406) {
                    console.error('💡 DIAGNOSTIC: 406 Error - RLS policies may be blocking queries')
                    console.error('   Possible causes:')
                    console.error('   1. RLS is enabled but not configured to allow SELECT')
                    console.error('   2. The profile record may not exist for this user')
                    console.error('   3. User ID in auth doesn\'t match profiles table')
                    console.error('   ➜ Check Supabase dashboard: Authentication > Policies')

                    // Set profile to null but don't throw - allow app to continue
                    setProfile(null)
                    setIsFetching(false)
                    // IMPORTANT: Still return without throwing, so loading state can be set to false
                    return
                }

                // On timeout, retry if we haven't exceeded max attempts
                if (error.message.includes('timeout')) {
                    console.warn(`⏱️  Query timeout (attempt ${attempts + 1}/${MAX_FETCH_ATTEMPTS}). Retrying...`)
                    if (attempts + 1 < MAX_FETCH_ATTEMPTS) {
                        // Add slight delay to allow Supabase to recover before retry
                        await new Promise(resolve => setTimeout(resolve, 1000))
                        // Mark as not fetching before recursive call
                        setIsFetching(false)
                        // Recursive retry
                        return await fetchProfile(userId)
                    } else {
                        console.error('💡 DIAGNOSTIC: Max retry attempts reached for timeout. Supabase may be experiencing issues.')
                        setProfile(null)
                        setIsFetching(false)
                        return
                    }
                }

                // For any other error, set profile to null and continue (don't crash the app)
                console.warn('⚠️ Profile fetch failed, but app will continue to work with limited functionality')
                setProfile(null)
                setIsFetching(false)
                return
            }

            if (!data) {
                console.warn('⚠️ No profile found for user:', userId)
                setProfile(null)
                setIsFetching(false)
                return
            }

            // Convert role to is_admin boolean for convenience
            const profileData: Profile = {
                ...data,
                is_admin: data.role === 'admin',
            }
            console.log('✅ Profile loaded successfully:', profileData.email)
            setProfile(profileData)
            setIsFetching(false)
        } catch (err) {
            console.error('❌ Error fetching profile:', err)
            console.error('📋 Full error details:', err instanceof Error ? err.message : JSON.stringify(err))
            setProfile(null)
            setIsFetching(false)
            // Note: We set profile to null but don't re-throw, allowing the app to continue
            // This prevents infinite loading states when profile fetch fails
        }
    }

    /**
     * Sign up with email, password, and full name
     * Creates auth user and profile record
     */
    async function signUp(email: string, password: string, fullName: string) {
        try {
            setError(null)

            // Trim email and full name to remove whitespace
            const trimmedEmail = email.trim().toLowerCase()
            const trimmedFullName = fullName.trim()

            console.log('📝 Sign-up attempt with email:', trimmedEmail)

            // Step 1: Create auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: trimmedEmail,
                password,
            })

            if (authError) {
                console.error('❌ Auth sign-up error:', {
                    message: authError.message,
                    code: authError.code,
                    status: authError.status,
                    email: trimmedEmail,
                })
                setError(authError.message)
                return { error: authError }
            }

            if (!authData.user) {
                const err = new Error('Sign up failed: no user returned')
                setError(err.message)
                return { error: err }
            }

            // Step 2: Create profile record (role defaults to 'student')
            const { error: profileError } = await supabase.from('profiles').insert({
                id: authData.user.id,
                email: trimmedEmail,
                full_name: trimmedFullName,
                role: 'student', // Default role for new sign-ups
            })

            if (profileError) {
                // If profile creation fails, attempt to delete the auth user
                await supabase.auth.admin
                    .deleteUser(authData.user.id)
                    .catch((deleteErr) => console.error('Error cleaning up auth user:', deleteErr))

                setError(profileError.message)
                return { error: profileError }
            }

            // Fetch the created profile
            await fetchProfile(authData.user.id)

            return { error: null }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Sign up failed'
            setError(errorMessage)
            return { error: err instanceof Error ? err : new Error(errorMessage) }
        }
    }

    /**
     * Sign in with email and password
     * Authenticates user and loads their profile
     */
    async function signIn(email: string, password: string) {
        try {
            setError(null)

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                setError(error.message)
                return { error }
            }

            if (data.user) {
                setUser(data.user)
                await fetchProfile(data.user.id)
            }

            return { error: null }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Sign in failed'
            setError(errorMessage)
            return { error: err instanceof Error ? err : new Error(errorMessage) }
        }
    }

    /**
     * Sign out the current user
     */
    async function signOut() {
        try {
            setError(null)
            const { error } = await supabase.auth.signOut()

            if (error) {
                setError(error.message)
                return { error }
            }

            setUser(null)
            setProfile(null)
            return { error: null }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Sign out failed'
            setError(errorMessage)
            return { error: err instanceof Error ? err : new Error(errorMessage) }
        }
    }

    /**
     * Reset error state (call after showing error to user)
     */
    function resetError() {
        setError(null)
    }

    /**
     * Listen for auth state changes
     * This runs once on mount to check if user is already logged in
     */
    useEffect(() => {
        setLoading(true)
        let isMounted = true

        // Check current session
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (!isMounted) return

                if (session?.user) {
                    setUser(session.user)
                    console.log('✅ Session found, loading profile...')
                    // Clear fetch attempts for new user
                    setFetchAttempts(new Map())
                    await fetchProfile(session.user.id)
                } else {
                    console.log('ℹ️  No session found')
                    setUser(null)
                    setProfile(null)
                }
            } catch (err) {
                if (!isMounted) return
                console.error('❌ Error checking session:', err)
                setUser(null)
                setProfile(null)
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        checkSession()

        // Subscribe to auth state changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!isMounted) return

            console.log('🔔 Auth state changed:', _event)

            // Only refetch profile on these events
            const shouldFetchProfile = ['SIGNED_IN', 'SIGNED_UP', 'USER_UPDATED'].includes(_event)

            // Skip INITIAL_SESSION if profile is already loaded and hasn't changed
            if (_event === 'INITIAL_SESSION' && profile && session?.user?.id === user?.id) {
                console.log('⏳ INITIAL_SESSION detected but profile already loaded, skipping refetch')
                setLoading(false)
                return
            }

            // Don't process the same event twice in a row
            if (_event === lastAuthEvent && session?.user?.id === user?.id) {
                console.log(`⏳ Duplicate auth event: ${_event}, skipping`)
                setLoading(false)
                return
            }

            setLastAuthEvent(_event)

            if (session?.user) {
                setUser(session.user)

                // Only refetch if it's an actual state change, not just session restoration
                if (shouldFetchProfile) {
                    setLoading(true)
                    console.log('✅ User authenticated, loading profile...')
                    // Clear fetch attempts for this user
                    setFetchAttempts(new Map())
                    await fetchProfile(session.user.id)
                    if (isMounted) {
                        setLoading(false)
                    }
                } else {
                    // For INITIAL_SESSION, just set loading to false since profile is already there
                    if (isMounted) {
                        setLoading(false)
                    }
                }
            } else {
                setUser(null)
                setProfile(null)
                setFetchAttempts(new Map())
                setLoading(false)
                console.log('ℹ️  User signed out')
            }
        })

        // Cleanup subscription on unmount
        return () => {
            isMounted = false
            subscription?.unsubscribe()
        }
    }, [])

    return (
        <AuthContext.Provider value={{ user, profile, loading, error, signIn, signUp, signOut, resetError }}>
            {children}
        </AuthContext.Provider>
    )
}

/**
 * Hook to use auth context
 * Usage: const { user, profile, loading, signIn, signUp, signOut } = useAuth()
 */
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}