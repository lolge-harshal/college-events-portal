import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

interface Event {
    id: string
    title: string
    description: string
    location: string
    start_time: string
    end_time: string
    capacity: number
    created_at: string
    updated_at: string
    organizer_id: string
}

interface EventWithStats extends Event {
    current_registrations?: number
}

/**
 * Events Page Component
 * 
 * Features:
 * - Fetch all events from database
 * - Display events as cards
 * - Search/filter by event title
 * - Toggle to show only upcoming events
 * - Link to event detail page
 * - Show capacity information
 */
export default function Events() {
    const [events, setEvents] = useState<EventWithStats[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [showUpcomingOnly, setShowUpcomingOnly] = useState(true)

    /**
     * Fetch events from database
     */
    async function fetchEvents() {
        setIsLoading(true)
        setError('')

        try {
            let query = supabase
                .from('events')
                .select('*')
                .order('start_time', { ascending: true })

            const { data, error: fetchError } = await query

            if (fetchError) throw fetchError

            if (!data) {
                setEvents([])
                return
            }

            // Fetch registration counts for each event
            const eventsWithStats = await Promise.all(
                data.map(async (event) => {
                    const { count, error: countError } = await supabase
                        .from('registrations')
                        .select('*', { count: 'exact', head: true })
                        .eq('event_id', event.id)

                    if (countError) {
                        console.error('Error fetching registration count:', countError)
                        return { ...event, current_registrations: 0 }
                    }

                    return {
                        ...event,
                        current_registrations: count || 0,
                    }
                })
            )

            setEvents(eventsWithStats)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch events'
            setError(errorMessage)
            setEvents([])
        } finally {
            setIsLoading(false)
        }
    }

    /**
     * Load events on component mount
     */
    useEffect(() => {
        fetchEvents()
    }, [])

    /**
     * Filter events based on search term and upcoming toggle
     */
    function getFilteredEvents(): EventWithStats[] {
        let filtered = events

        // Filter by search term (title)
        if (searchTerm.trim()) {
            filtered = filtered.filter((event) =>
                event.title.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        // Filter by upcoming
        if (showUpcomingOnly) {
            const now = new Date()
            filtered = filtered.filter((event) => {
                const startTime = new Date(event.start_time)
                return startTime > now
            })
        }

        return filtered
    }

    /**
     * Format date and time
     */
    function formatDateTime(dateTime: string): string {
        const date = new Date(dateTime)
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    /**
     * Format date only
     */
    function formatDate(dateTime: string): string {
        const date = new Date(dateTime)
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }

    /**
     * Check if event is upcoming
     */
    function isUpcoming(startTime: string): boolean {
        return new Date(startTime) > new Date()
    }

    /**
     * Get capacity status color
     */
    function getCapacityColor(current: number, capacity: number): string {
        const percentage = (current / capacity) * 100
        if (percentage >= 100) return 'text-red-600'
        if (percentage >= 80) return 'text-orange-600'
        if (percentage >= 50) return 'text-yellow-600'
        return 'text-green-600'
    }

    const filteredEvents = getFilteredEvents()

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900">Events</h1>
                    <p className="text-gray-600 mt-2">Discover and register for upcoming college events</p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                        <span className="text-red-600 mr-3 mt-0.5">⚠️</span>
                        <div className="flex-1">
                            <p className="text-red-800 font-medium">Error Loading Events</p>
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

                {/* Search and Filter Section */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-8 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search by Title
                        </label>
                        <input
                            type="text"
                            placeholder="Search events..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="upcomingOnly"
                            checked={showUpcomingOnly}
                            onChange={(e) => setShowUpcomingOnly(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <label htmlFor="upcomingOnly" className="ml-2 text-sm text-gray-700">
                            Show only upcoming events
                        </label>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            <p className="mt-4 text-gray-600">Loading events...</p>
                        </div>
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                        <p className="text-xl text-gray-600">
                            {events.length === 0
                                ? 'No events available at the moment'
                                : 'No events match your search criteria'}
                        </p>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                            >
                                Clear Search
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEvents.map((event) => (
                            <Link key={event.id} to={`/events/${event.id}`}>
                                <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow overflow-hidden h-full flex flex-col">
                                    {/* Event Header with Status */}
                                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex justify-between items-start">
                                        <div>
                                            <h2 className="text-xl font-bold text-white line-clamp-2">
                                                {event.title}
                                            </h2>
                                        </div>
                                        {isUpcoming(event.start_time) && (
                                            <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap">
                                                Upcoming
                                            </span>
                                        )}
                                    </div>

                                    {/* Event Body */}
                                    <div className="p-4 flex-grow flex flex-col">
                                        {/* Description */}
                                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                            {event.description}
                                        </p>

                                        {/* Event Details */}
                                        <div className="space-y-2 text-sm text-gray-700 flex-grow">
                                            <div className="flex items-center">
                                                <span className="text-blue-600 mr-2">📅</span>
                                                <span>{formatDate(event.start_time)}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="text-blue-600 mr-2">🕐</span>
                                                <span>{formatDateTime(event.start_time)}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="text-blue-600 mr-2">📍</span>
                                                <span className="line-clamp-1">{event.location}</span>
                                            </div>
                                        </div>

                                        {/* Capacity Status */}
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-700 font-medium">
                                                    Capacity
                                                </span>
                                                <span
                                                    className={`text-sm font-bold ${getCapacityColor(
                                                        event.current_registrations || 0,
                                                        event.capacity
                                                    )}`}
                                                >
                                                    {event.current_registrations || 0} / {event.capacity}
                                                </span>
                                            </div>

                                            {/* Capacity Bar */}
                                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${((event.current_registrations || 0) / event.capacity) >= 0.8
                                                            ? 'bg-red-500'
                                                            : 'bg-green-500'
                                                        }`}
                                                    style={{
                                                        width: `${Math.min(
                                                            ((event.current_registrations || 0) / event.capacity) * 100,
                                                            100
                                                        )}%`,
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* View Details Button */}
                                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                                        <button className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition">
                                            View Details & Register
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Summary */}
                {!isLoading && filteredEvents.length > 0 && (
                    <div className="mt-8 text-center text-gray-600">
                        <p>
                            Showing {filteredEvents.length} of {events.length} event
                            {events.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}