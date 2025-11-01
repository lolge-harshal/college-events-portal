import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/**
 * ProtectedRoute Component
 * 
 * Wraps routes that require authentication.
 * If user is not authenticated, redirects to /auth/login
 * If loading, shows spinner
 * If authenticated, renders the requested component
 * 
 * Usage:
 * <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
 */
interface ProtectedRouteProps {
    children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user, loading } = useAuth()

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

    // If authenticated, render the component
    return children
}