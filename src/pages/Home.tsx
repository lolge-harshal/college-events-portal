export default function Home() {
    return (
        <div className="container mx-auto px-4 py-12">
            {/* Hero Section */}
            <section className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg p-12 mb-12">
                <h1 className="text-5xl font-bold mb-4">Welcome to College Events Portal</h1>
                <p className="text-xl mb-6">
                    Discover and manage all upcoming college events in one place
                </p>
                <button className="bg-white text-blue-600 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition">
                    Browse Events
                </button>
            </section>

            {/* Features Section */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-blue-600 mb-4">📅 Easy Scheduling</h2>
                    <p className="text-gray-600">
                        View all college events organized by date, time, and category
                    </p>
                </div>

                <div className="bg-white p-8 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-purple-600 mb-4">🎯 Filter & Search</h2>
                    <p className="text-gray-600">
                        Find events that match your interests with powerful search filters
                    </p>
                </div>

                <div className="bg-white p-8 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-pink-600 mb-4">⭐ Save Favorites</h2>
                    <p className="text-gray-600">
                        Create an account and save your favorite events for quick access
                    </p>
                </div>
            </section>

            {/* Coming Soon Section */}
            <section className="mt-12 bg-blue-50 p-8 rounded-lg">
                <h2 className="text-3xl font-bold text-center mb-4">Features Coming Soon</h2>
                <ul className="list-disc list-inside space-y-2 text-lg text-gray-700 max-w-2xl mx-auto">
                    <li>User authentication and profiles</li>
                    <li>Event management dashboard</li>
                    <li>Real-time notifications</li>
                    <li>Calendar integration</li>
                    <li>Social sharing features</li>
                </ul>
            </section>
        </div>
    )
}