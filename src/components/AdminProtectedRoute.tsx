import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/**
 * AdminProtectedRoute Component
 *
 * Wraps routes that require admin authentication.
 * - If user is not authenticated, redirects to /auth/login
 * - If user is authenticated but not an admin, redirects to home with error toast
 * - If loading, shows spinner
 * - If authenticated and is_admin, renders the requested component
 *
 * Usage:
 * <Route path="/admin/dashboard" element={<AdminProtectedRoute><Dashboard /></AdminProtectedRoute>} />
 */
interface AdminProtectedRouteProps {
    children: React.ReactNode
}

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
    const { user, profile, loading } = useAuth()

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

    // If not authenticated, redirect to login
    if (!user) {
        return <Navigate to="/auth/login" replace />
    }

    // If authenticated but profile is still loading/missing, show loading spinner
    // This prevents premature "Access Denied" redirects during page refresh
    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Verifying admin access...</p>
                </div>
            </div>
        )
    }

    // If authenticated but not admin, redirect to home
    // Store error message in localStorage for displaying toast on home page
    if (!profile.is_admin) {
        // Store error message
        sessionStorage.setItem('adminError', 'You do not have permission to access this page. Admin access required.')
        return <Navigate to="/" replace />
    }

    // If authenticated and is admin, render the component
    return children
}