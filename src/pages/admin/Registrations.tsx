import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { withTimeout } from '../../lib/queryTimeout'
import { useAuth } from '../../hooks/useAuth'
import { exportRegistrationsToCSV, RegistrationExportData } from '../../lib/csvExport'

interface Event {
    id: string
    title: string
    capacity: number
}

interface Profile {
    id: string
    full_name: string
    email: string
    role: string
}

interface Registration {
    id: string
    profile_id: string
    event_id: string
    registered_at: string
    status: string
    notes: string | null
    profile?: Profile
}

/**
 * Admin Registrations Component
 * 
 * Features:
 * - View all registrations for an event
 * - Change registration status
 * - Add/edit admin notes
 * - Delete registrations
 * - Export registrations to CSV
 * - Display attendee profile details
 */
export default function Registrations() {
    const { eventId } = useParams<{ eventId: string }>()
    const navigate = useNavigate()
    const { profile } = useAuth()

    // State
    const [event, setEvent] = useState<Event | null>(null)
    const [registrations, setRegistrations] = useState<Registration[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [editingNotesId, setEditingNotesId] = useState<string | null>(null)
    const [editingNotes, setEditingNotes] = useState<string>('')
    const [savingNotesId, setSavingNotesId] = useState<string | null>(null)

    /**
     * Load event and registrations
     */
    async function loadData() {
        if (!eventId) {
            setError('Event not found')
            setIsLoading(false)
            return
        }

        try {
            setIsLoading(true)
            console.log('🔄 Loading registrations for event:', eventId)

            // Fetch event
            const { data: eventData, error: eventError } = await withTimeout<Event>(
                supabase.from('events').select('id, title, capacity').eq('id', eventId).single(),
                10000
            )

            if (eventError) {
                throw eventError
            }

            if (!eventData) {
                throw new Error('Event not found')
            }

            // Check authorization
            if (profile?.role === 'organizer') {
                const { data: checkEvent } = await supabase
                    .from('events')
                    .select('organizer_id')
                    .eq('id', eventId)
                    .single()

                if (checkEvent?.organizer_id !== profile.id) {
                    throw new Error('You can only view registrations for your own events')
                }
            }

            setEvent(eventData)
            console.log('✅ Event loaded')

            // Fetch registrations with profile info
            const { data: registrationData, error: regError } = await withTimeout<any[]>(
                supabase
                    .from('registrations')
                    .select(
                        `
                        id,
                        profile_id,
                        event_id,
                        registered_at,
                        status,
                        notes,
                        profile:profile_id (
                            id,
                            full_name,
                            email,
                            role
                        )
                    `
                    )
                    .eq('event_id', eventId)
                    .order('registered_at', { ascending: false }),
                10000
            )

            if (regError) {
                throw regError
            }

            setRegistrations(registrationData || [])
            console.log(`✅ Loaded ${registrationData?.length || 0} registrations`)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load registrations'
            console.error('❌ Load error:', errorMessage)
            setError(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    /**
     * Update registration status
     */
    async function updateStatus(registrationId: string, newStatus: string) {
        try {
            console.log('📝 Updating status for registration:', registrationId)

            const { error: updateError } = await supabase
                .from('registrations')
                .update({ status: newStatus })
                .eq('id', registrationId)

            if (updateError) {
                throw updateError
            }

            // Update UI
            setRegistrations(
                registrations.map(r => (r.id === registrationId ? { ...r, status: newStatus } : r))
            )

            console.log('✅ Status updated')
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update status'
            console.error('❌ Update error:', errorMessage)
            setError(errorMessage)
        }
    }

    /**
     * Save notes for registration
     */
    async function saveNotes(registrationId: string) {
        try {
            setSavingNotesId(registrationId)
            console.log('💬 Saving notes for registration:', registrationId)

            const { error: updateError } = await supabase
                .from('registrations')
                .update({ notes: editingNotes || null })
                .eq('id', registrationId)

            if (updateError) {
                throw updateError
            }

            // Update UI
            setRegistrations(
                registrations.map(r =>
                    r.id === registrationId ? { ...r, notes: editingNotes || null } : r
                )
            )

            setEditingNotesId(null)
            setEditingNotes('')
            console.log('✅ Notes saved')
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to save notes'
            console.error('❌ Save error:', errorMessage)
            setError(errorMessage)
        } finally {
            setSavingNotesId(null)
        }
    }

    /**
     * Delete registration
     */
    async function deleteRegistration(registrationId: string) {
        try {
            console.log('🗑️  Deleting registration:', registrationId)

            const { error: deleteError } = await supabase
                .from('registrations')
                .delete()
                .eq('id', registrationId)

            if (deleteError) {
                throw deleteError
            }

            // Update UI
            setRegistrations(registrations.filter(r => r.id !== registrationId))
            console.log('✅ Registration deleted')
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete registration'
            console.error('❌ Delete error:', errorMessage)
            setError(errorMessage)
        }
    }

    /**
     * Export registrations to CSV
     */
    function handleExportCSV() {
        if (!event) return

        const exportData: RegistrationExportData[] = registrations.map(reg => ({
            profile_name: reg.profile?.full_name || 'Unknown',
            email: reg.profile?.email || 'Unknown',
            registered_at: new Date(reg.registered_at).toLocaleString(),
            status: reg.status,
            notes: reg.notes,
        }))

        exportRegistrationsToCSV(exportData, event.title)
        console.log('✅ CSV exported')
    }

    /**
     * Format date and time
     */
    function formatDateTime(dateTime: string): string {
        return new Date(dateTime).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    useEffect(() => {
        loadData()
    }, [eventId])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading registrations...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Page Header */}
                <div className="mb-8 flex justify-between items-start">
                    <div>
                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            className="text-blue-600 hover:text-blue-700 font-semibold mb-2"
                        >
                            ← Back to Dashboard
                        </button>
                        <h1 className="text-4xl font-bold text-gray-900">Registrations</h1>
                        {event && (
                            <p className="text-gray-600 mt-2">
                                {event.title} • {registrations.length} / {event.capacity} registered
                            </p>
                        )}
                    </div>

                    <button
                        onClick={handleExportCSV}
                        disabled={registrations.length === 0}
                        className={`px-6 py-3 font-semibold rounded-lg transition ${registrations.length === 0
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                    >
                        📥 Export CSV
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

                {/* Registrations List */}
                {registrations.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                        <p className="text-xl text-gray-600">No registrations yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {registrations.map(registration => (
                            <div
                                key={registration.id}
                                className="bg-white rounded-lg shadow-lg p-6 space-y-4"
                            >
                                {/* Attendee Info */}
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">
                                            {registration.profile?.full_name || 'Unknown'}
                                        </h3>
                                        <p className="text-gray-600">📧 {registration.profile?.email}</p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Registered: {formatDateTime(registration.registered_at)}
                                        </p>
                                    </div>

                                    {/* Status Badge */}
                                    <span
                                        className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap ${registration.status === 'registered'
                                                ? 'bg-green-100 text-green-700'
                                                : registration.status === 'waitlisted'
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-gray-100 text-gray-700'
                                            }`}
                                    >
                                        {registration.status}
                                    </span>
                                </div>

                                {/* Status Update */}
                                <div className="border-t pt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={registration.status}
                                        onChange={e => updateStatus(registration.id, e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="registered">Registered</option>
                                        <option value="waitlisted">Waitlisted</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>

                                {/* Notes Section */}
                                <div className="border-t pt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Admin Notes
                                    </label>

                                    {editingNotesId === registration.id ? (
                                        <div className="space-y-2">
                                            <textarea
                                                value={editingNotes}
                                                onChange={e => setEditingNotes(e.target.value)}
                                                placeholder="Add notes (accessibility needs, special requests, etc.)"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                rows={3}
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => saveNotes(registration.id)}
                                                    disabled={savingNotesId === registration.id}
                                                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                                >
                                                    {savingNotesId === registration.id ? 'Saving...' : 'Save'}
                                                </button>
                                                <button
                                                    onClick={() => setEditingNotesId(null)}
                                                    className="px-4 py-2 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            {registration.notes ? (
                                                <p className="text-gray-700 mb-2">{registration.notes}</p>
                                            ) : (
                                                <p className="text-gray-500 italic mb-2">No notes yet</p>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setEditingNotesId(registration.id)
                                                    setEditingNotes(registration.notes || '')
                                                }}
                                                className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
                                            >
                                                ✏️ Edit Notes
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Delete Button */}
                                <div className="border-t pt-4 flex justify-end">
                                    <button
                                        onClick={() => {
                                            if (
                                                confirm(
                                                    `Are you sure you want to remove ${registration.profile?.full_name} from this event?`
                                                )
                                            ) {
                                                deleteRegistration(registration.id)
                                            }
                                        }}
                                        className="px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition"
                                    >
                                        🗑️ Remove Registration
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}