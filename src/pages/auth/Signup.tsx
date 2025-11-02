import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

/**
 * Signup Page Component
 * 
 * Features:
 * - Email + Password + Full Name registration
 * - Creates user in auth and profile in database
 * - Form validation
 * - Password strength indicator
 * - Error handling with helpful messages
 * - Redirect authenticated users to /profile
 */
export default function Signup() {
    const navigate = useNavigate()
    const { user, loading, signUp, error: authError, resetError } = useAuth()

    // Form state
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    // Redirect authenticated users to profile
    useEffect(() => {
        if (!loading && user) {
            navigate('/profile')
        }
    }, [user, loading, navigate])

    /**
     * Calculate password strength (0-4)
     */
    function getPasswordStrength(pwd: string): number {
        let strength = 0
        if (pwd.length >= 8) strength++
        if (pwd.length >= 12) strength++
        if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++
        if (/\d/.test(pwd)) strength++
        return Math.min(strength, 4)
    }

    /**
     * Validate email format
     */
    function isValidEmail(emailInput: string): boolean {
        // RFC 5322 compliant email regex (simplified)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(emailInput.trim())
    }

    /**
     * Validate form inputs
     */
    function validateForm(): string | null {
        if (!email.trim()) return 'Email is required'
        if (!isValidEmail(email)) return 'Please enter a valid email address'
        if (!fullName.trim()) return 'Full name is required'
        if (fullName.trim().length < 2) return 'Full name must be at least 2 characters'
        if (!password) return 'Password is required'
        if (password.length < 8) return 'Password must be at least 8 characters'
        if (password !== confirmPassword) return 'Passwords do not match'
        return null
    }

    /**
     * Handle form submission
     */
    async function handleSignup(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setSuccess(false)

        // Validate
        const validationError = validateForm()
        if (validationError) {
            setError(validationError)
            return
        }

        setIsLoading(true)
        const { error } = await signUp(email.trim(), password, fullName.trim())

        if (error) {
            // Handle specific Supabase error messages
            let errorMessage = error.message || 'Failed to create account'

            // Improve error messages
            if (errorMessage.includes('Email') || errorMessage.includes('email')) {
                if (errorMessage.includes('invalid')) {
                    errorMessage = 'The email address format is invalid. Please check and try again.'
                } else if (errorMessage.includes('already')) {
                    errorMessage = 'This email address is already registered. Please sign in or use a different email.'
                } else if (errorMessage.includes('not allowed')) {
                    errorMessage = 'This email address is not allowed. Please use a different email.'
                }
            }

            setError(errorMessage)
            setIsLoading(false)
        } else {
            // Show success message
            setSuccess(true)
            setEmail('')
            setPassword('')
            setConfirmPassword('')
            setFullName('')

            // Redirect after 2 seconds
            setTimeout(() => {
                navigate('/profile')
            }, 2000)
        }
    }

    const passwordStrength = getPasswordStrength(password)
    const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
    const strengthColors = [
        'bg-red-500',
        'bg-orange-500',
        'bg-yellow-500',
        'bg-lime-500',
        'bg-green-500',
    ]

    // Show loading spinner while checking auth state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
            <div className="w-full max-w-md">
                {/* Card Container */}
                <div className="bg-white rounded-lg shadow-xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
                        <p className="text-gray-600">Join our college events community</p>
                    </div>

                    {/* Success Alert */}
                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start" role="alert">
                            <span className="text-green-600 mr-3 mt-0.5">✓</span>
                            <div>
                                <p className="text-green-800 font-medium">Account created successfully!</p>
                                <p className="text-green-700 text-sm">Redirecting to your profile...</p>
                            </div>
                        </div>
                    )}

                    {/* Error Alert */}
                    {(error || authError) && !success && (
                        <div
                            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start"
                            role="alert"
                        >
                            <span className="text-red-600 mr-3 mt-0.5">⚠️</span>
                            <div>
                                <p className="text-red-800 font-medium">Error</p>
                                <p className="text-red-700 text-sm">{error || authError}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setError('')
                                    resetError()
                                }}
                                className="ml-auto text-red-600 hover:text-red-800 font-bold text-lg"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {/* Signup Form */}
                    <form onSubmit={handleSignup} className="space-y-4">
                        {/* Full Name Input */}
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name
                            </label>
                            <input
                                id="fullName"
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="John Doe"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Email Input */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@college.edu"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Password Input */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                disabled={isLoading}
                            />

                            {/* Password Strength Indicator */}
                            {password && (
                                <div className="mt-2 space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-600">Password strength:</span>
                                        <span className={`font-medium ${strengthColors[passwordStrength].replace('bg-', 'text-')}`}>
                                            {strengthLabels[passwordStrength]}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`h-full ${strengthColors[passwordStrength]} transition-all`}
                                            style={{ width: `${((passwordStrength + 1) / 4) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            {/* Password Requirements */}
                            <p className="text-xs text-gray-500 mt-2">
                                At least 8 characters, including uppercase, lowercase, and numbers
                            </p>
                        </div>

                        {/* Confirm Password Input */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                disabled={isLoading}
                            />
                            {password && confirmPassword && password !== confirmPassword && (
                                <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-400 transition"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                                    Creating account...
                                </span>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    {/* Terms & Conditions */}
                    <p className="text-xs text-gray-500 text-center mt-4">
                        By signing up, you agree to our{' '}
                        <button className="text-blue-600 hover:underline">Terms of Service</button> and{' '}
                        <button className="text-blue-600 hover:underline">Privacy Policy</button>
                    </p>

                    {/* Divider */}
                    <div className="mt-6 relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Already have an account?</span>
                        </div>
                    </div>

                    {/* Sign In Link */}
                    <Link
                        to="/auth/login"
                        className="mt-6 w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium text-center hover:bg-gray-200 transition block"
                    >
                        Sign In
                    </Link>
                </div>

                {/* Footer Info */}
                <p className="text-center text-gray-600 text-sm mt-6">
                    Questions? Contact support at support@college-events.edu
                </p>
            </div>
        </div>
    )
}