import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'

/**
 * Profile Page Component
 * 
 * Features:
 * - View user email and full name
 * - Edit full name with inline editing
 * - Admin-only controls (if user is admin)
 * - Loading states and error handling
 * - Protected route (redirects if not authenticated)
 */
export default function Profile() {
    const navigate = useNavigate()
    const { user, profile, loading, signOut } = useAuth()

    // Form state
    const [editMode, setEditMode] = useState(false)
    const [fullName, setFullName] = useState('')
    const [isUpdating, setIsUpdating] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            navigate('/auth/login')
        }
    }, [user, loading, navigate])

    // Initialize form with profile data
    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name)
        }
    }, [profile])

    /**
     * Update profile full_name
     */
    async function handleUpdateProfile(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (!fullName.trim()) {
            setError('Full name cannot be empty')
            return
        }

        if (fullName === profile?.full_name) {
            setEditMode(false)
            return
        }

        setIsUpdating(true)

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: fullName.trim() })
                .eq('id', user!.id)

            if (error) {
                setError(error.message)
            } else {
                setSuccess('Profile updated successfully!')
                setEditMode(false)

                // Clear success message after 3 seconds
                setTimeout(() => setSuccess(''), 3000)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update profile')
        } finally {
            setIsUpdating(false)
        }
    }

    /**
     * Handle sign out
     */
    async function handleSignOut() {
        const { error } = await signOut()
        if (!error) {
            navigate('/auth/login')
        }
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

    // Redirect if not authenticated (safety check)
    if (!user) {
        return null
    }

    // If profile failed to load, show an error message but allow the user to see their email
    if (!profile) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4">
                <div className="max-w-2xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-gray-900">My Profile</h1>
                        <p className="text-gray-600 mt-2">Manage your account settings</p>
                    </div>

                    {/* Error Alert */}
                    <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start" role="alert">
                        <span className="text-orange-600 mr-3 mt-0.5">⚠️</span>
                        <div>
                            <p className="text-orange-800 font-medium">Profile Loading</p>
                            <p className="text-orange-700 text-sm">
                                We're having trouble loading your full profile details. However, your account is active.
                                Try refreshing the page or contact support if the issue persists.
                            </p>
                        </div>
                    </div>

                    {/* Basic Info Card */}
                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Information</h2>

                        {/* Email Field */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                            <div className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-900 font-medium">
                                {user.email}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Email cannot be changed. Contact support to update.</p>
                        </div>

                        {/* User ID */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-blue-800">
                                <strong>User ID:</strong> <code className="bg-blue-100 px-2 py-1 rounded text-xs">{user.id}</code>
                            </p>
                        </div>
                    </div>

                    {/* Quick Actions Section */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-8 border border-blue-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Ready to Explore More?</h3>
                                <p className="text-sm text-gray-600">Browse events, register for activities, and connect with your college community.</p>
                            </div>
                            <div className="flex gap-3 ml-4">
                                <Link
                                    to="/events"
                                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
                                >
                                    View Events
                                </Link>
                                <button
                                    onClick={handleSignOut}
                                    className="px-6 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition whitespace-nowrap"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900">My Profile</h1>
                    <p className="text-gray-600 mt-2">Manage your account settings</p>
                </div>

                {/* Success Alert */}
                {success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start" role="alert">
                        <span className="text-green-600 mr-3 mt-0.5">✓</span>
                        <div>
                            <p className="text-green-800 font-medium">Success</p>
                            <p className="text-green-700 text-sm">{success}</p>
                        </div>
                    </div>
                )}

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start" role="alert">
                        <span className="text-red-600 mr-3 mt-0.5">⚠️</span>
                        <div>
                            <p className="text-red-800 font-medium">Error</p>
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                        <button
                            onClick={() => setError('')}
                            className="ml-auto text-red-600 hover:text-red-800 font-bold text-lg"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Profile Card */}
                <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                    {/* Profile Header */}
                    <div className="flex items-center justify-between mb-8 pb-8 border-b border-gray-200">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Account Information</h2>
                            <p className="text-gray-600 text-sm mt-1">Member since {new Date(profile.created_at).toLocaleDateString()}</p>
                        </div>
                        {/* Role Badge */}
                        <div
                            className={`px-4 py-2 rounded-full font-semibold text-white text-sm ${profile.role === 'admin'
                                ? 'bg-red-500'
                                : profile.role === 'organizer'
                                    ? 'bg-purple-500'
                                    : 'bg-blue-500'
                                }`}
                        >
                            {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                        </div>
                    </div>

                    {/* Email Field (Read-only) */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                        <div className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-900 font-medium">
                            {user.email || profile.email}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed. Contact support to update.</p>
                    </div>

                    {/* Full Name Field (Editable) */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>

                        {!editMode ? (
                            <div className="flex items-center justify-between">
                                <p className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium flex-1">
                                    {profile.full_name}
                                </p>
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="ml-3 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                                >
                                    Edit
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleUpdateProfile} className="space-y-3">
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    disabled={isUpdating}
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        disabled={isUpdating}
                                        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                                    >
                                        {isUpdating ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditMode(false)
                                            setFullName(profile.full_name)
                                            setError('')
                                        }}
                                        disabled={isUpdating}
                                        className="px-4 py-2 bg-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-400 disabled:bg-gray-300 transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Additional Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-blue-800">
                            <strong>User ID:</strong> <code className="bg-blue-100 px-2 py-1 rounded text-xs">{profile.id}</code>
                        </p>
                    </div>
                </div>

                {/* Admin Dashboard Quick Access */}
                {profile.is_admin && (
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-8 mb-8">
                        <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center">
                            <span className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-2 text-sm">
                                👑
                            </span>
                            Admin Panel
                        </h3>

                        <p className="text-purple-800 mb-6">
                            You have administrative access to manage events, registrations, and organize college activities.
                        </p>

                        <button
                            onClick={() => navigate('/admin/events/new')}
                            className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition text-left flex items-center group">
                            <span className="mr-3 text-lg group-hover:scale-110 transition-transform">➕</span>
                            <div>
                                <div className="font-semibold">Create Event</div>
                                <div className="text-xs text-blue-100">Add new event</div>
                            </div>
                        </button>

                        <div className="mt-4 p-4 bg-purple-100 rounded-lg border border-purple-200">
                            <p className="text-sm text-purple-800">
                                <strong>💡 Tip:</strong> Use the admin dashboard to create, edit, and manage all college events. View registration details and export attendee information.
                            </p>
                        </div>
                    </div>
                )}

                {/* Quick Actions Section */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-8 border border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Ready to Explore?</h3>
                            <p className="text-sm text-gray-600">Check out events happening around campus.</p>
                        </div>
                        <div className="flex gap-3 ml-4">
                            <Link
                                to="/events"
                                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
                            >
                                View Events
                            </Link>
                            <button
                                onClick={handleSignOut}
                                className="px-6 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition whitespace-nowrap"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>

                {/* Last Updated Info */}
                <p className="text-center text-gray-500 text-xs mt-8">
                    Last updated: {new Date(profile.updated_at).toLocaleString()}
                </p>
            </div>
        </div>
    )
}