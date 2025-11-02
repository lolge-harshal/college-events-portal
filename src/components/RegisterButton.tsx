import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'

interface RegisterButtonProps {
    eventId: string
    currentRegistrations: number
    capacity: number
    onRegistrationSuccess?: () => void
}

/**
 * RegisterButton Component
 * 
 * Handles user registration for events.
 * - Redirects to login if not authenticated
 * - Prevents duplicate registrations
 * - Handles capacity checking
 * - Shows confirmation modal on success
 */
export default function RegisterButton({
    eventId,
    currentRegistrations,
    capacity,
    onRegistrationSuccess,
}: RegisterButtonProps) {
    const navigate = useNavigate()
    const { user, loading: authLoading } = useAuth()

    // Local state
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [showConfirmation, setShowConfirmation] = useState(false)
    const [isRegistered, setIsRegistered] = useState(false)

    // Derive state
    const isEventFull = currentRegistrations >= capacity
    const remainingSeats = capacity - currentRegistrations
    // User is logged in if they have a Supabase user, even if profile fetch failed
    // This allows registration even if there are RLS issues
    const isLoggedIn = !!user && !authLoading

    /**
     * Check if user's profile exists in the database
     * This is crucial because registrations have a foreign key constraint on profiles
     */
    async function checkProfileExists(): Promise<boolean> {
        if (!user) return false

        try {
            console.log('🔍 Checking if profile exists for user:', user.id)
            const { data, error } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', user.id)
                .maybeSingle() // Use maybeSingle to handle case where no profile exists

            if (error) {
                // 406 errors are OK - it just means RLS is blocking the check
                if (error.message?.includes('406') || error.message?.includes('Not Acceptable')) {
                    console.warn('⚠️ Cannot verify profile due to RLS policies. Proceeding with registration anyway.')
                    return true // Assume profile exists if we can't check due to RLS
                }
                throw error
            }

            const exists = !!data
            console.log(exists ? '✅ Profile exists' : '❌ Profile does not exist')
            return exists
        } catch (err) {
            console.error('Error checking profile existence:', err)
            // On error, try to proceed anyway - let the database foreign key fail
            return true
        }
    }

    /**
     * Check if user is already registered for this event
     */
    async function checkExistingRegistration(): Promise<boolean> {
        if (!user) return false

        try {
            const { data, error: checkError } = await supabase
                .from('registrations')
                .select('id')
                .eq('event_id', eventId)
                .eq('profile_id', user.id)
                .single()

            if (checkError && checkError.code !== 'PGRST116') {
                // PGRST116 = no rows found, which is expected
                throw checkError
            }

            return !!data
        } catch (err) {
            console.error('Error checking existing registration:', err)
            return false
        }
    }

    /**
     * Handle registration button click
     */
    async function handleRegister() {
        setError('')

        // Redirect to login if not logged in
        if (!isLoggedIn) {
            navigate('/auth/login')
            return
        }

        // Check if already registered
        setIsLoading(true)
        try {
            const alreadyRegistered = await checkExistingRegistration()
            if (alreadyRegistered) {
                setError('You are already registered for this event')
                setIsRegistered(true)
                setIsLoading(false)
                return
            }

            // Check capacity
            if (isEventFull) {
                setError('This event is at full capacity')
                setIsLoading(false)
                return
            }

            // Check if profile exists (prevents foreign key constraint errors)
            const profileExists = await checkProfileExists()
            if (!profileExists) {
                setError('Your profile does not exist. Please contact support or try logging out and back in.')
                setIsLoading(false)
                return
            }

            // Insert registration
            const { error: insertError } = await supabase.from('registrations').insert({
                event_id: eventId,
                profile_id: user.id,
                registered_at: new Date().toISOString(),
                status: 'registered',
            })

            if (insertError) {
                console.error('❌ Registration insert failed:', insertError)

                // Check if it's a foreign key constraint error
                if (insertError.message.includes('foreign key') || insertError.code === 'PGRST116') {
                    setError('Failed to register: Your profile data is missing. Please try logging out and back in.')
                } else {
                    setError(insertError.message || 'Registration failed')
                }
                setIsLoading(false)
                return
            }

            // Success
            setIsRegistered(true)
            setShowConfirmation(true)
            if (onRegistrationSuccess) {
                onRegistrationSuccess()
            }

            // Auto-hide confirmation after 3 seconds
            setTimeout(() => setShowConfirmation(false), 3000)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Registration failed'
            setError(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    // Loading state
    if (authLoading) {
        return (
            <button
                disabled
                className="w-full px-4 py-2 bg-gray-300 text-gray-600 font-semibold rounded-lg cursor-not-allowed"
            >
                Loading...
            </button>
        )
    }

    // Already registered
    if (isRegistered) {
        return (
            <div className="space-y-3">
                <button
                    disabled
                    className="w-full px-4 py-2 bg-green-100 text-green-700 font-semibold rounded-lg cursor-not-allowed border border-green-300"
                >
                    ✓ Registered
                </button>
                {showConfirmation && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
                        <span className="text-green-600 mr-3 mt-0.5">✓</span>
                        <div>
                            <p className="text-green-800 font-medium">Registration Confirmed!</p>
                            <p className="text-green-700 text-sm">
                                You are now registered for this event. Check your profile for all registrations.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // Event is full
    if (isEventFull) {
        return (
            <div className="space-y-3">
                <button
                    disabled
                    className="w-full px-4 py-2 bg-gray-200 text-gray-600 font-semibold rounded-lg cursor-not-allowed"
                >
                    Event Full
                </button>
                <p className="text-center text-gray-600 text-sm">All {capacity} seats are booked</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <button
                onClick={handleRegister}
                disabled={isLoading || !isLoggedIn}
                className={`w-full px-4 py-3 font-semibold rounded-lg transition ${isLoggedIn
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {isLoading ? 'Registering...' : isLoggedIn ? 'Register for Event' : 'Sign In to Register'}
            </button>

            {/* Error message */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                    <span className="text-red-600 mr-3 mt-0.5">⚠️</span>
                    <div className="flex-1">
                        <p className="text-red-800 font-medium">Registration Failed</p>
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                    <button
                        onClick={() => setError('')}
                        className="ml-3 text-red-600 hover:text-red-800"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Confirmation message */}
            {showConfirmation && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
                    <span className="text-green-600 mr-3 mt-0.5">✓</span>
                    <div>
                        <p className="text-green-800 font-medium">Registration Confirmed!</p>
                        <p className="text-green-700 text-sm">
                            You are now registered for this event. You have {remainingSeats - 1} seat{
                                remainingSeats - 1 !== 1 ? 's' : ''
                            } left.
                        </p>
                    </div>
                </div>
            )}

            {/* Capacity info */}
            <div className="text-center text-sm text-gray-600">
                <p>
                    <strong>{remainingSeats}</strong> of <strong>{capacity}</strong> seats available
                </p>
            </div>
        </div>
    )
}