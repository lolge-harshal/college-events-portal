import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Header() {
    const { user, profile, loading, signOut } = useAuth()

    async function handleSignOut() {
        await signOut()
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
                                <li className="border-l border-blue-400 pl-6 flex items-center space-x-3">
                                    <div className="text-right">
                                        <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
                                        {profile?.role && (
                                            <p className="text-xs text-blue-100 capitalize">{profile.role}</p>
                                        )}
                                    </div>
                                    <Link
                                        to="/profile"
                                        className="bg-blue-500 hover:bg-blue-400 rounded-full p-2 transition"
                                        title="Profile"
                                    >
                                        👤
                                    </Link>
                                    <button
                                        onClick={handleSignOut}
                                        className="hover:text-blue-200 transition font-medium text-sm"
                                    >
                                        Sign Out
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
            </nav>
        </header>
    )
}