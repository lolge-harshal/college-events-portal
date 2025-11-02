import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { withTimeout } from '../../lib/queryTimeout'
import { useAuth } from '../../hooks/useAuth'

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
    image_path?: string
}

interface EventWithStats extends Event {
    registrations_count?: number
    organizer_name?: string
}

/**
 * Admin Dashboard Component
 * 
 * Features:
 * - View all events (created by any organizer, or by current user if organizer)
 * - Create new events
 * - Edit events
 * - Delete events with confirmation
 * - View registrations for each event
 * - Search and filter events
 * - Display event statistics (registrations, capacity)
 */
export default function Dashboard() {
    const navigate = useNavigate()
    const { profile } = useAuth()

    // State
    const [events, setEvents] = useState<EventWithStats[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

    /**
     * Fetch all events with registration counts
     */
    async function fetchEvents() {
        setIsLoading(true)
        setError('')

        try {
            console.log('🔄 Fetching events for admin dashboard...')

            // Admin can see all events, organizers can only see their own
            let query = supabase.from('events').select('*').order('created_at', { ascending: false })

            if (profile?.role === 'organizer') {
                query = query.eq('organizer_id', profile.id)
            }

            const { data, error: fetchError } = await withTimeout<Event[]>(query, 10000)

            if (fetchError) {
                throw fetchError
            }

            if (!data) {
                setEvents([])
                return
            }

            console.log(`✅ Loaded ${data.length} events`)

            // Fetch registration counts and organizer names for each event
            const eventsWithStats = await Promise.all(
                data.map(async (event: Event) => {
                    try {
                        // Fetch registration count
                        const { count } = await withTimeout<any[]>(
                            supabase
                                .from('registrations')
                                .select('*', { count: 'exact', head: true })
                                .eq('event_id', event.id),
                            5000
                        )

                        // Fetch organizer name
                        const { data: organizerData } = await withTimeout<any>(
                            supabase
                                .from('profiles')
                                .select('full_name')
                                .eq('id', event.organizer_id)
                                .single(),
                            5000
                        )

                        return {
                            ...event,
                            registrations_count: count || 0,
                            organizer_name: organizerData?.full_name || 'Unknown',
                        }
                    } catch (err) {
                        console.error('Error fetching stats for event', event.id, err)
                        return {
                            ...event,
                            registrations_count: 0,
                            organizer_name: 'Unknown',
                        }
                    }
                })
            )

            setEvents(eventsWithStats)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch events'
            console.error('❌ Dashboard error:', errorMessage)
            setError(errorMessage)
            setEvents([])
        } finally {
            setIsLoading(false)
        }
    }

    /**
     * Delete event with confirmation
     */
    async function handleDeleteEvent(eventId: string) {
        try {
            setError('')

            console.log('🗑️  Deleting event:', eventId)

            // Delete event (will cascade delete registrations)
            const { error: deleteError } = await supabase.from('events').delete().eq('id', eventId)

            if (deleteError) {
                throw deleteError
            }

            console.log('✅ Event deleted successfully')

            // Remove from UI
            setEvents(events.filter(e => e.id !== eventId))
            setDeleteConfirm(null)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete event'
            console.error('❌ Delete error:', errorMessage)
            setError(errorMessage)
        }
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
     * Filter events based on search term
     */
    const filteredEvents = events.filter(
        event =>
            event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.organizer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    /**
     * Get capacity color
     */
    function getCapacityColor(registrations: number, capacity: number): string {
        const percentage = (registrations / capacity) * 100
        if (percentage >= 100) return 'text-red-600'
        if (percentage >= 80) return 'text-orange-600'
        if (percentage >= 50) return 'text-yellow-600'
        return 'text-green-600'
    }

    useEffect(() => {
        fetchEvents()
    }, [])

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Page Header */}
                <div className="mb-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-gray-600 mt-2">Manage all events and registrations</p>
                    </div>
                    <button
                        onClick={() => navigate('/admin/events/new')}
                        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                    >
                        ➕ Create Event
                    </button>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                        <span className="text-red-600 mr-3 mt-0.5">⚠️</span>
                        <div className="flex-1">
                            <p className="text-red-800 font-medium">Error</p>
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

                {/* Search Section */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                    <input
                        type="text"
                        placeholder="Search by event title or organizer..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
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
                            {events.length === 0 ? 'No events created yet' : 'No events match your search'}
                        </p>
                        {events.length === 0 && (
                            <button
                                onClick={() => navigate('/admin/events/new')}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                            >
                                Create First Event
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredEvents.map(event => (
                            <div
                                key={event.id}
                                className="bg-white rounded-lg shadow-lg p-6 flex justify-between items-start"
                            >
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                                        <p>📍 {event.location}</p>
                                        <p>🕐 {formatDateTime(event.start_time)}</p>
                                        <p>👤 Organizer: {event.organizer_name}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className={`font-semibold ${getCapacityColor(event.registrations_count || 0, event.capacity)}`}>
                                            {event.registrations_count || 0} / {event.capacity} registered
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => navigate(`/admin/events/${event.id}/registrations`)}
                                        className="px-3 py-2 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 transition"
                                        title="View registrations"
                                    >
                                        👥 Registrations
                                    </button>
                                    <button
                                        onClick={() => navigate(`/admin/events/${event.id}/edit`)}
                                        className="px-3 py-2 bg-green-100 text-green-700 font-semibold rounded-lg hover:bg-green-200 transition"
                                        title="Edit event"
                                    >
                                        ✏️ Edit
                                    </button>
                                    <div className="relative">
                                        <button
                                            onClick={() => setDeleteConfirm(deleteConfirm === event.id ? null : event.id)}
                                            className="px-3 py-2 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition"
                                            title="Delete event"
                                        >
                                            🗑️ Delete
                                        </button>

                                        {/* Delete Confirmation */}
                                        {deleteConfirm === event.id && (
                                            <div className="absolute right-0 mt-2 bg-white border border-red-300 rounded-lg shadow-lg p-4 z-10 w-64">
                                                <p className="text-gray-700 mb-4">
                                                    Are you sure you want to delete <strong>{event.title}</strong>?
                                                </p>
                                                <p className="text-sm text-gray-600 mb-4">
                                                    This will also remove all {event.registrations_count || 0} registrations for this event.
                                                </p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleDeleteEvent(event.id)}
                                                        className="flex-1 px-3 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
                                                    >
                                                        Delete
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm(null)}
                                                        className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}