import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import RegisterButton from '../components/RegisterButton'

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

interface Organizer {
    id: string
    full_name: string
    email: string
    role: string
}

/**
 * Event Detail Page Component
 * 
 * Features:
 * - Fetch single event by ID
 * - Display event details and description
 * - Show event image (if exists in Supabase storage)
 * - Display capacity and available seats
 * - Show organizer information
 * - Registration button with real-time capacity updates
 */
export default function EventDetail() {
    const { eventId } = useParams<{ eventId: string }>()

    // State
    const [event, setEvent] = useState<Event | null>(null)
    const [organizer, setOrganizer] = useState<Organizer | null>(null)
    const [currentRegistrations, setCurrentRegistrations] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [imageUrl, setImageUrl] = useState('')

    /**
     * Fetch event details
     */
    async function fetchEventDetails() {
        if (!eventId) {
            setError('Event not found')
            setIsLoading(false)
            return
        }

        try {
            // Fetch event
            const { data: eventData, error: eventError } = await supabase
                .from('events')
                .select('*')
                .eq('id', eventId)
                .single()

            if (eventError) throw eventError

            if (!eventData) {
                setError('Event not found')
                setIsLoading(false)
                return
            }

            setEvent(eventData)

            // Fetch organizer details
            const { data: organizerData, error: organizerError } = await supabase
                .from('profiles')
                .select('id, full_name, email, role')
                .eq('id', eventData.organizer_id)
                .single()

            if (organizerError) {
                console.error('Error fetching organizer:', organizerError)
            } else {
                setOrganizer(organizerData)
            }

            // Fetch registration count
            const { count, error: countError } = await supabase
                .from('registrations')
                .select('*', { count: 'exact', head: true })
                .eq('event_id', eventId)

            if (countError) {
                console.error('Error fetching registration count:', countError)
            } else {
                setCurrentRegistrations(count || 0)
            }

            // Fetch image if path exists
            if (eventData.image_path) {
                try {
                    const { data: signedUrlData } = await supabase.storage
                        .from('event-images')
                        .createSignedUrl(eventData.image_path, 3600) // URL valid for 1 hour

                    if (signedUrlData?.signedUrl) {
                        setImageUrl(signedUrlData.signedUrl)
                    }
                } catch (imgError) {
                    console.error('Error fetching image URL:', imgError)
                }
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load event'
            setError(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    /**
     * Subscribe to registration updates
     */
    useEffect(() => {
        fetchEventDetails()

        if (!eventId) return

        // Subscribe to registration changes
        const subscription = supabase
            .channel(`registrations:${eventId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'registrations',
                    filter: `event_id=eq.${eventId}`,
                },
                () => {
                    // Refetch registration count when changes occur
                    supabase
                        .from('registrations')
                        .select('*', { count: 'exact', head: true })
                        .eq('event_id', eventId)
                        .then(({ count }) => {
                            setCurrentRegistrations(count || 0)
                        })
                }
            )
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [eventId])

    /**
     * Format date and time
     */
    function formatDateTime(dateTime: string): string {
        const date = new Date(dateTime)
        return date.toLocaleString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    /**
     * Calculate duration in minutes
     */
    function calculateDuration(startTime: string, endTime: string): string {
        const start = new Date(startTime)
        const end = new Date(endTime)
        const minutes = Math.round((end.getTime() - start.getTime()) / 60000)
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60

        if (hours === 0) return `${mins} minutes`
        if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`
        return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minute${mins > 1 ? 's' : ''}`
    }

    /**
     * Check if event is upcoming
     */
    function isUpcoming(): boolean {
        if (!event) return false
        return new Date(event.start_time) > new Date()
    }

    /**
     * Handle registration success
     */
    function handleRegistrationSuccess() {
        // Refetch current count
        if (!eventId) return

        supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId)
            .then(({ count }) => {
                setCurrentRegistrations(count || 0)
            })
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading event details...</p>
                </div>
            </div>
        )
    }

    // Error state
    if (error || !event) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
                        <p className="text-gray-600 mb-6">{error || 'The event you are looking for does not exist.'}</p>
                        <Link
                            to="/events"
                            className="inline-block px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                        >
                            Back to Events
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    const remainingSeats = Math.max(0, event.capacity - currentRegistrations)

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Back Button */}
                <Link
                    to="/events"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 font-semibold"
                >
                    ← Back to Events
                </Link>

                {/* Event Header */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
                    {/* Event Image */}
                    {imageUrl ? (
                        <div className="w-full h-96 bg-gray-200 overflow-hidden">
                            <img
                                src={imageUrl}
                                alt={event.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="w-full h-96 bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center">
                            <div className="text-center text-white">
                                <span className="text-6xl">📅</span>
                                <p className="mt-2 text-lg font-semibold">Event Image</p>
                            </div>
                        </div>
                    )}

                    {/* Event Title and Status */}
                    <div className="p-8 border-b border-gray-200">
                        <div className="flex justify-between items-start mb-4">
                            <h1 className="text-4xl font-bold text-gray-900 flex-1">{event.title}</h1>
                            {isUpcoming() && (
                                <span className="bg-green-500 text-white px-4 py-2 rounded-full font-semibold whitespace-nowrap ml-4">
                                    Upcoming
                                </span>
                            )}
                        </div>
                        <p className="text-gray-600 text-lg">{event.description}</p>
                    </div>

                    {/* Event Details Grid */}
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Start Time */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Start Time</h3>
                            <p className="text-lg text-gray-900">{formatDateTime(event.start_time)}</p>
                        </div>

                        {/* End Time */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">End Time</h3>
                            <p className="text-lg text-gray-900">{formatDateTime(event.end_time)}</p>
                        </div>

                        {/* Location */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Location</h3>
                            <p className="text-lg text-gray-900">📍 {event.location}</p>
                        </div>

                        {/* Duration */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Duration</h3>
                            <p className="text-lg text-gray-900">⏱️ {calculateDuration(event.start_time, event.end_time)}</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Full Description */}
                        <div className="bg-white rounded-lg shadow-lg p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Event</h2>
                            <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
                                {event.description}
                            </p>
                        </div>

                        {/* Organizer Information */}
                        {organizer && (
                            <div className="bg-white rounded-lg shadow-lg p-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">Organizer</h2>
                                <div className="flex items-center space-x-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl">
                                        👤
                                    </div>
                                    <div>
                                        <p className="text-lg font-semibold text-gray-900">{organizer.full_name}</p>
                                        <p className="text-gray-600">{organizer.email}</p>
                                        <span className="inline-block mt-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                                            {organizer.role.charAt(0).toUpperCase() + organizer.role.slice(1)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Registration */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-lg p-8 sticky top-8">
                            {/* Capacity Section */}
                            <div className="mb-8">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Event Capacity</h3>

                                {/* Big Numbers */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="text-center">
                                        <div className="text-4xl font-bold text-blue-600">
                                            {currentRegistrations}
                                        </div>
                                        <p className="text-gray-600 text-sm mt-1">Registered</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-4xl font-bold text-green-600">
                                            {remainingSeats}
                                        </div>
                                        <p className="text-gray-600 text-sm mt-1">Available</p>
                                    </div>
                                </div>

                                {/* Capacity Info */}
                                <p className="text-center text-gray-700 font-semibold mb-4">
                                    {currentRegistrations} of {event.capacity} seats taken
                                </p>

                                {/* Capacity Bar */}
                                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${currentRegistrations / event.capacity >= 0.8
                                            ? 'bg-red-500'
                                            : currentRegistrations / event.capacity >= 0.5
                                                ? 'bg-yellow-500'
                                                : 'bg-green-500'
                                            }`}
                                        style={{
                                            width: `${Math.min(
                                                (currentRegistrations / event.capacity) * 100,
                                                100
                                            )}%`,
                                        }}
                                    ></div>
                                </div>

                                {/* Capacity Message */}
                                {currentRegistrations >= event.capacity ? (
                                    <p className="text-red-600 font-semibold text-sm mt-3 text-center">
                                        ⚠️ Event is at full capacity
                                    </p>
                                ) : remainingSeats <= 5 ? (
                                    <p className="text-orange-600 font-semibold text-sm mt-3 text-center">
                                        🔥 Only {remainingSeats} seat{remainingSeats !== 1 ? 's' : ''} left!
                                    </p>
                                ) : null}
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-200 my-8"></div>

                            {/* Registration Button */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Register Now</h3>
                                <RegisterButton
                                    eventId={event.id}
                                    currentRegistrations={currentRegistrations}
                                    capacity={event.capacity}
                                    onRegistrationSuccess={handleRegistrationSuccess}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}