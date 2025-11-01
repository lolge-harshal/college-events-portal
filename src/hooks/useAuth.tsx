import { useState, useEffect, useContext, createContext, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

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

    /**
     * Fetch user profile from the 'profiles' table
     * Called when user logs in or component mounts
     */
    async function fetchProfile(userId: string) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) throw error

            // Convert role to is_admin boolean for convenience
            const profileData: Profile = {
                ...data,
                is_admin: data.role === 'admin',
            }
            setProfile(profileData)
        } catch (err) {
            console.error('Error fetching profile:', err)
            setProfile(null)
        }
    }

    /**
     * Sign up with email, password, and full name
     * Creates auth user and profile record
     */
    async function signUp(email: string, password: string, fullName: string) {
        try {
            setError(null)

            // Step 1: Create auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            })

            if (authError) {
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
                email,
                full_name: fullName,
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

        // Check current session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser(session.user)
                fetchProfile(session.user.id)
            }
            setLoading(false)
        })

        // Subscribe to auth state changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                setUser(session.user)
                await fetchProfile(session.user.id)
            } else {
                setUser(null)
                setProfile(null)
            }
            setLoading(false)
        })

        // Cleanup subscription on unmount
        return () => subscription?.unsubscribe()
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