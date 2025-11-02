import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Header() {
    const { user, profile, loading, signOut } = useAuth()
    const [isSigningOut, setIsSigningOut] = useState(false)
    const [signOutError, setSignOutError] = useState('')

    async function handleSignOut() {
        setSignOutError('')
        setIsSigningOut(true)
        try {
            const { error } = await signOut()
            if (error) {
                console.error('❌ Sign out error:', error)
                setSignOutError('Failed to sign out. Please try again.')
            } else {
                console.log('✅ Successfully signed out')
            }
        } catch (err) {
            console.error('❌ Unexpected sign out error:', err)
            setSignOutError('An unexpected error occurred during sign out.')
        } finally {
            setIsSigningOut(false)
        }
    }

    return (
        <header className="bg-blue-600 text-white shadow-lg">
            <nav className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <Link to="/" className="text-2xl font-bold hover:text-blue-100 transition">
                        College Events Portal
                    </Link>
                    <ul className="flex items-center space-x-6">
                        <li>
                            <Link to="/" className="hover:text-blue-200 transition">
                                Home
                            </Link>
                        </li>
                        <li>
                            <Link to="/events" className="hover:text-blue-200 transition">
                                Events
                            </Link>
                        </li>

                        {/* Authenticated User Links */}
                        {!loading && user ? (
                            <>
                                <li className="border-l border-blue-400 pl-6 flex items-center justify-end gap-4 whitespace-nowrap">
                                    {/* User Info */}
                                    <div className="flex items-center gap-3">
                                        <div className="text-right min-w-fit">
                                            <p className="text-sm font-semibold">{profile?.full_name || 'User'}</p>
                                            {profile?.role && (
                                                <p className="text-xs text-blue-100 capitalize">{profile.role}</p>
                                            )}
                                        </div>
                                        <Link
                                            to="/profile"
                                            className="bg-blue-500 hover:bg-blue-400 rounded-full p-2 transition flex-shrink-0 text-lg"
                                            title="View Profile"
                                        >
                                            👤
                                        </Link>
                                    </div>
                                    {/* Sign Out Button */}
                                    <button
                                        onClick={handleSignOut}
                                        disabled={isSigningOut}
                                        className={`px-3 py-2 rounded-lg font-medium text-sm transition flex-shrink-0 ${isSigningOut
                                                ? 'opacity-50 cursor-not-allowed bg-blue-700'
                                                : 'hover:bg-blue-700'
                                            }`}
                                    >
                                        {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                                    </button>
                                </li>
                            </>
                        ) : (
                            <>
                                {/* Unauthenticated User Links */}
                                <li>
                                    <Link
                                        to="/auth/login"
                                        className="hover:text-blue-200 transition font-medium"
                                    >
                                        Sign In
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/auth/signup"
                                        className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition font-medium"
                                    >
                                        Sign Up
                                    </Link>
                                </li>
                            </>
                        )}
                    </ul>
                </div>

                {/* Error message */}
                {signOutError && (
                    <div className="mt-2 p-2 bg-red-500 bg-opacity-90 rounded text-sm flex items-start justify-between">
                        <span>{signOutError}</span>
                        <button
                            onClick={() => setSignOutError('')}
                            className="ml-2 font-bold hover:text-red-100"
                        >
                            ✕
                        </button>
                    </div>
                )}
            </nav>
        </header>
    )
}