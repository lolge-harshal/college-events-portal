import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

/**
 * Login Page Component
 * 
 * Features:
 * - Email + Password authentication
 * - Link to Signup page
 * - Optional Magic Link toggle (uncomment to enable)
 * - Loading states and error handling
 * - Redirect authenticated users to /profile
 */
export default function Login() {
    const navigate = useNavigate()
    const { user, loading, signIn, error: authError, resetError } = useAuth()

    // Form state
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [showMagicLink, setShowMagicLink] = useState(false)

    // Redirect authenticated users to profile
    useEffect(() => {
        if (!loading && user) {
            navigate('/profile')
        }
    }, [user, loading, navigate])

    /**
     * Handle Email + Password login
     */
    async function handleEmailLogin(e: React.FormEvent) {
        e.preventDefault()
        setError('')

        if (!email.trim() || !password.trim()) {
            setError('Please enter both email and password')
            return
        }

        setIsLoading(true)
        const { error } = await signIn(email, password)

        if (error) {
            setError(error.message || 'Failed to sign in')
        } else {
            // Success - useAuth will trigger redirect
            setEmail('')
            setPassword('')
        }

        setIsLoading(false)
    }

    /**
     * Handle Magic Link login (optional feature)
     * Uncomment to enable in production
     */
    async function handleMagicLink(e: React.FormEvent) {
        e.preventDefault()
        setError('')

        if (!email.trim()) {
            setError('Please enter your email')
            return
        }

        setIsLoading(true)

        // Example magic link implementation (requires Supabase setup)
        // const { error } = await supabase.auth.signInWithOtp({ email })
        // if (error) setError(error.message)
        // else setError('') // Show success message instead

        // For now, show placeholder
        setError('Magic link feature not yet configured')

        setIsLoading(false)
    }

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
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
                        <p className="text-gray-600">Sign in to your account to continue</p>
                    </div>

                    {/* Error Alert */}
                    {(error || authError) && (
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

                    {/* Tab Switcher */}
                    <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setShowMagicLink(false)}
                            className={`flex-1 py-2 px-3 rounded font-medium transition ${!showMagicLink
                                    ? 'bg-white text-blue-600 shadow'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Email & Password
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowMagicLink(true)}
                            className={`flex-1 py-2 px-3 rounded font-medium transition ${showMagicLink
                                    ? 'bg-white text-blue-600 shadow'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Magic Link
                        </button>
                    </div>

                    {/* Email + Password Form */}
                    {!showMagicLink && (
                        <form onSubmit={handleEmailLogin} className="space-y-4">
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
                                    placeholder="you@example.com"
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
                                        Signing in...
                                    </span>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>
                    )}

                    {/* Magic Link Form */}
                    {showMagicLink && (
                        <form onSubmit={handleMagicLink} className="space-y-4">
                            {/* Email Input */}
                            <div>
                                <label htmlFor="magic-email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address
                                </label>
                                <input
                                    id="magic-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    disabled={isLoading}
                                />
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
                                        Sending link...
                                    </span>
                                ) : (
                                    'Send Magic Link'
                                )}
                            </button>

                            <p className="text-xs text-gray-500 text-center mt-3">
                                We'll send you a link to sign in without needing a password.
                            </p>
                        </form>
                    )}

                    {/* Divider */}
                    <div className="mt-6 relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">No account yet?</span>
                        </div>
                    </div>

                    {/* Sign Up Link */}
                    <Link
                        to="/auth/signup"
                        className="mt-6 w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium text-center hover:bg-gray-200 transition block"
                    >
                        Create an Account
                    </Link>
                </div>

                {/* Footer Info */}
                <p className="text-center text-gray-600 text-sm mt-6">
                    Having trouble? Contact support at support@college-events.edu
                </p>
            </div>
        </div>
    )
}