import { useEffect, useState } from 'react'

export default function Home() {
    const [adminError, setAdminError] = useState<string | null>(null)

    useEffect(() => {
        // Check for admin error from failed auth attempt
        const error = sessionStorage.getItem('adminError')
        if (error) {
            setAdminError(error)
            sessionStorage.removeItem('adminError')

            // Auto-hide after 5 seconds
            const timer = setTimeout(() => setAdminError(null), 5000)
            return () => clearTimeout(timer)
        }
    }, [])

    return (
        <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                {/* Admin Error Toast */}
                {adminError && (
                    <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start max-w-2xl shadow-sm transition-all animate-in">
                        <span className="text-red-600 mr-4 mt-0.5 text-lg flex-shrink-0">⚠️</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-red-800 font-semibold">Access Denied</p>
                            <p className="text-red-700 text-sm mt-1">{adminError}</p>
                        </div>
                        <button
                            onClick={() => setAdminError(null)}
                            className="ml-4 flex-shrink-0 text-red-600 hover:text-red-800 transition-colors"
                            aria-label="Dismiss error"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Hero Section */}
                <section className="mb-16 sm:mb-20">
                    <div className="bg-blue-600 bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 text-white rounded-2xl shadow-lg p-8 sm:p-12 lg:p-16 overflow-hidden relative">
                        {/* Decorative background element */}
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>

                        <div className="relative z-10">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight text-white">
                                Welcome to College Events Portal
                            </h1>
                            <p className="text-lg sm:text-xl text-white mb-8 max-w-2xl leading-relaxed font-medium">
                                Discover and manage all upcoming college events in one place. Connect with your community and never miss an opportunity to engage.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                                <a href="/events" className="inline-block bg-white text-blue-600 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors shadow-md hover:shadow-lg text-center">
                                    🔍 Browse Events
                                </a>
                                <a href="/auth/signup" className="inline-block bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg hover:bg-blue-800 transition-colors shadow-md hover:shadow-lg border border-blue-600 text-center">
                                    📝 Get Started
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="mb-16 sm:mb-20">
                    <div className="text-center mb-12 sm:mb-16">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                            ✨ Key Features
                        </h2>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                            Everything you need to discover, register, and manage events
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                        {/* Feature Card 1 */}
                        <div className="bg-white rounded-xl shadow-premium p-8 hover:shadow-lg transition-shadow duration-300 group">
                            <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">📅</div>
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Easy Scheduling</h3>
                            <p className="text-gray-600 leading-relaxed">
                                View all college events organized by date, time, and category. Never miss an event that matches your interests.
                            </p>
                        </div>

                        {/* Feature Card 2 */}
                        <div className="bg-white rounded-xl shadow-premium p-8 hover:shadow-lg transition-shadow duration-300 group">
                            <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">🎯</div>
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Filter & Search</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Find events that match your interests with powerful search filters and advanced sorting options.
                            </p>
                        </div>

                        {/* Feature Card 3 */}
                        <div className="bg-white rounded-xl shadow-premium p-8 hover:shadow-lg transition-shadow duration-300 group">
                            <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">⭐</div>
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Manage Events</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Create an account and manage your event registrations. Get notifications and updates about your events.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Capabilities Section */}
                <section className="mb-16 sm:mb-20">
                    <div className="bg-secondary-50 rounded-xl border border-secondary-200 p-8 sm:p-12 lg:p-16">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
                            🚀 Platform Capabilities
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
                            <div className="flex items-start gap-4">
                                <span className="text-2xl flex-shrink-0">✅</span>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">User Authentication</h3>
                                    <p className="text-gray-600 text-sm">Secure email/password authentication with Supabase</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <span className="text-2xl flex-shrink-0">✅</span>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Event Registration</h3>
                                    <p className="text-gray-600 text-sm">Register for events and track your registrations</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <span className="text-2xl flex-shrink-0">✅</span>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Admin Dashboard</h3>
                                    <p className="text-gray-600 text-sm">Manage events, registrations, and export data</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <span className="text-2xl flex-shrink-0">✅</span>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Image Upload</h3>
                                    <p className="text-gray-600 text-sm">Add beautiful images to your events</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <span className="text-2xl flex-shrink-0">✅</span>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Real-time Updates</h3>
                                    <p className="text-gray-600 text-sm">Live event information and registration counts</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <span className="text-2xl flex-shrink-0">✅</span>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Responsive Design</h3>
                                    <p className="text-gray-600 text-sm">Works seamlessly on all devices</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="text-center">
                    <div className="bg-blue-600 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 sm:p-12 text-white">
                        <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white">Ready to Get Started?</h2>
                        <p className="text-white text-lg mb-8 max-w-2xl mx-auto font-medium">
                            Join our community of event enthusiasts and never miss out on exciting opportunities
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <a href="/auth/signup" className="inline-block bg-white text-blue-600 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors">
                                Create Account
                            </a>
                            <a href="/events" className="inline-block bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg hover:bg-blue-800 transition-colors border border-blue-600">
                                Browse Events
                            </a>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}