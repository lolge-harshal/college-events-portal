import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { withTimeout } from '../../lib/queryTimeout'
import { useAuth } from '../../hooks/useAuth'
import { uploadEventImage, deleteEventImage } from '../../lib/imageUpload'

interface Event {
    id: string
    title: string
    description: string
    location: string
    start_time: string
    end_time: string
    capacity: number
    image_path?: string
    organizer_id: string
}

/**
 * Admin Event Form Component
 * 
 * Features:
 * - Create new events
 * - Edit existing events
 * - Upload and manage event images
 * - Form validation
 * - Image preview
 * - Save to database and Supabase storage
 */
export default function EventForm() {
    const { eventId } = useParams<{ eventId: string }>()
    const navigate = useNavigate()
    const { user, profile } = useAuth()

    const isEditMode = !!eventId && eventId !== 'new'

    // Form state
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [location, setLocation] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [capacity, setCapacity] = useState('')
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string>('')
    const [existingImagePath, setExistingImagePath] = useState<string | null>(null)

    // UI state
    const [isLoading, setIsLoading] = useState(isEditMode)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState('')
    const [uploadingImage, setUploadingImage] = useState(false)

    // Validation error state
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

    /**
     * Load event details for editing
     */
    async function loadEvent() {
        if (!isEditMode || !eventId) return

        try {
            setIsLoading(true)
            console.log('🔄 Loading event:', eventId)

            const { data, error: fetchError } = await withTimeout<Event>(
                supabase.from('events').select('*').eq('id', eventId).single(),
                10000
            )

            if (fetchError) {
                throw fetchError
            }

            if (!data) {
                throw new Error('Event not found')
            }

            // Check authorization
            if (profile?.role === 'organizer' && data.organizer_id !== user?.id) {
                throw new Error('You can only edit your own events')
            }

            // Convert UTC timestamps to local ISO format for datetime-local input
            const startDate = new Date(data.start_time)
            const endDate = new Date(data.end_time)

            setTitle(data.title)
            setDescription(data.description)
            setLocation(data.location)
            setStartTime(startDate.toISOString().slice(0, 16))
            setEndTime(endDate.toISOString().slice(0, 16))
            setCapacity(String(data.capacity))
            setExistingImagePath(data.image_path || null)

            if (data.image_path) {
                setImagePreview(data.image_path)
            }

            console.log('✅ Event loaded')
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load event'
            console.error('❌ Load error:', errorMessage)
            setError(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    /**
     * Handle image file selection
     */
    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setImageFile(file)

        // Create preview
        const reader = new FileReader()
        reader.onload = e => {
            setImagePreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
    }

    /**
     * Validate form inputs with detailed field-level validation
     */
    function validateForm(): boolean {
        const errors: Record<string, string> = {}
        setFieldErrors({})

        // Title validation
        if (!title.trim()) {
            errors.title = 'Event title is required'
        } else if (title.trim().length < 3) {
            errors.title = 'Event title must be at least 3 characters'
        } else if (title.trim().length > 100) {
            errors.title = 'Event title must be less than 100 characters'
        }

        // Description validation
        if (!description.trim()) {
            errors.description = 'Event description is required'
        } else if (description.trim().length < 10) {
            errors.description = 'Event description must be at least 10 characters'
        } else if (description.trim().length > 2000) {
            errors.description = 'Event description must be less than 2000 characters'
        }

        // Location validation
        if (!location.trim()) {
            errors.location = 'Event location is required'
        } else if (location.trim().length < 3) {
            errors.location = 'Event location must be at least 3 characters'
        } else if (location.trim().length > 200) {
            errors.location = 'Event location must be less than 200 characters'
        }

        // Start time validation
        if (!startTime) {
            errors.startTime = 'Start time is required'
        }

        // End time validation
        if (!endTime) {
            errors.endTime = 'End time is required'
        }

        // Time comparison validation
        if (startTime && endTime) {
            const start = new Date(startTime)
            const end = new Date(endTime)
            const now = new Date()

            if (isNaN(start.getTime())) {
                errors.startTime = 'Invalid start date/time format'
            } else if (isNaN(end.getTime())) {
                errors.endTime = 'Invalid end date/time format'
            } else if (start >= end) {
                errors.endTime = 'End time must be after start time'
            } else if (start < now && !isEditMode) {
                errors.startTime = 'Start time cannot be in the past for new events'
            }
        }

        // Capacity validation
        if (!capacity || parseInt(capacity) <= 0) {
            errors.capacity = 'Capacity must be a positive number'
        } else if (parseInt(capacity) > 10000) {
            errors.capacity = 'Capacity cannot exceed 10,000'
        } else if (!Number.isInteger(parseFloat(capacity))) {
            errors.capacity = 'Capacity must be a whole number'
        }

        // Set errors and return validation status
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors)
            // Set first error as main error message
            const firstError = Object.values(errors)[0]
            setError(firstError)
            return false
        }

        return true
    }

    /**
     * Handle form submission
     */
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')

        if (!validateForm()) {
            return
        }

        setIsSaving(true)

        try {
            let imagePath = existingImagePath

            // Upload new image if provided
            if (imageFile) {
                setUploadingImage(true)

                // Delete old image if it exists
                if (existingImagePath) {
                    await deleteEventImage(existingImagePath)
                }

                // Upload new image
                const uploadResult = await uploadEventImage(eventId || 'temp', imageFile)
                if (uploadResult.error) {
                    throw uploadResult.error
                }
                imagePath = uploadResult.path || null

                setUploadingImage(false)
            }

            // Prepare event data
            const eventData = {
                title: title.trim(),
                description: description.trim(),
                location: location.trim(),
                start_time: new Date(startTime).toISOString(),
                end_time: new Date(endTime).toISOString(),
                capacity: parseInt(capacity),
                image_path: imagePath,
            }

            // Create or update event
            if (isEditMode) {
                console.log('📝 Updating event:', eventId)

                const { error: updateError } = await supabase
                    .from('events')
                    .update(eventData)
                    .eq('id', eventId)

                if (updateError) {
                    throw updateError
                }

                console.log('✅ Event updated')
            } else {
                console.log('✨ Creating new event')

                const { data: createData, error: createError } = await supabase
                    .from('events')
                    .insert([
                        {
                            ...eventData,
                            organizer_id: user?.id,
                        },
                    ])
                    .select()

                if (createError) {
                    throw createError
                }

                const newEventId = createData?.[0]?.id
                console.log('✅ Event created:', newEventId)

                // If we uploaded an image without knowing the event ID, update the image path
                if (imageFile && newEventId && imagePath?.includes('temp')) {
                    const oldPath = imagePath

                    // Re-upload with the correct event ID
                    const reuploadResult = await uploadEventImage(newEventId, imageFile)
                    if (reuploadResult.path) {
                        await supabase.from('events').update({ image_path: reuploadResult.path }).eq('id', newEventId)
                        await deleteEventImage(oldPath)
                    }
                }
            }

            // Redirect to dashboard
            navigate('/admin/dashboard')
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to save event'
            console.error('❌ Save error:', errorMessage)
            setError(errorMessage)
        } finally {
            setIsSaving(false)
            setUploadingImage(false)
        }
    }

    useEffect(() => {
        loadEvent()
    }, [eventId])

    if (isEditMode && isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading event...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-primary-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900">
                        {isEditMode ? '✏️ Edit Event' : '✨ Create New Event'}
                    </h1>
                    <p className="text-gray-600 mt-2">Fill in all details below to {isEditMode ? 'update' : 'create'} your event</p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start shadow-sm">
                        <span className="text-red-600 mr-3 mt-0.5 text-lg">⚠️</span>
                        <div className="flex-1">
                            <p className="text-red-800 font-semibold">Validation Error</p>
                            <p className="text-red-700 text-sm mt-1">{error}</p>
                        </div>
                        <button
                            onClick={() => setError('')}
                            className="ml-3 text-red-600 hover:text-red-800 transition"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-premium p-8 space-y-8">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Event Title <span className="text-red-600">*</span>
                            {title.length > 0 && <span className="text-gray-500 float-right text-xs">{title.length}/100</span>}
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g., Python Workshop"
                            maxLength={100}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${fieldErrors.title
                                ? 'border-red-500 focus:ring-red-500 bg-red-50'
                                : 'border-gray-300 focus:ring-primary-500 focus:border-transparent'
                                }`}
                        />
                        {fieldErrors.title && <p className="text-red-600 text-sm mt-1 flex items-center"><span className="mr-1">✕</span>{fieldErrors.title}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Description <span className="text-red-600">*</span>
                            {description.length > 0 && <span className="text-gray-500 float-right text-xs">{description.length}/2000</span>}
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Detailed event description..."
                            rows={5}
                            maxLength={2000}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition resize-none ${fieldErrors.description
                                ? 'border-red-500 focus:ring-red-500 bg-red-50'
                                : 'border-gray-300 focus:ring-primary-500 focus:border-transparent'
                                }`}
                        />
                        {fieldErrors.description && <p className="text-red-600 text-sm mt-1 flex items-center"><span className="mr-1">✕</span>{fieldErrors.description}</p>}
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Location <span className="text-red-600">*</span>
                        </label>
                        <input
                            type="text"
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            placeholder="e.g., Science Building, Room 201"
                            maxLength={200}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${fieldErrors.location
                                ? 'border-red-500 focus:ring-red-500 bg-red-50'
                                : 'border-gray-300 focus:ring-primary-500 focus:border-transparent'
                                }`}
                        />
                        {fieldErrors.location && <p className="text-red-600 text-sm mt-1 flex items-center"><span className="mr-1">✕</span>{fieldErrors.location}</p>}
                    </div>

                    {/* Date and Time Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time <span className="text-red-600">*</span></label>
                            <input
                                type="datetime-local"
                                value={startTime}
                                onChange={e => setStartTime(e.target.value)}
                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${fieldErrors.startTime
                                    ? 'border-red-500 focus:ring-red-500 bg-red-50'
                                    : 'border-gray-300 focus:ring-primary-500 focus:border-transparent'
                                    }`}
                            />
                            {fieldErrors.startTime && <p className="text-red-600 text-sm mt-1 flex items-center"><span className="mr-1">✕</span>{fieldErrors.startTime}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">End Time <span className="text-red-600">*</span></label>
                            <input
                                type="datetime-local"
                                value={endTime}
                                onChange={e => setEndTime(e.target.value)}
                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${fieldErrors.endTime
                                    ? 'border-red-500 focus:ring-red-500 bg-red-50'
                                    : 'border-gray-300 focus:ring-primary-500 focus:border-transparent'
                                    }`}
                            />
                            {fieldErrors.endTime && <p className="text-red-600 text-sm mt-1 flex items-center"><span className="mr-1">✕</span>{fieldErrors.endTime}</p>}
                        </div>
                    </div>

                    {/* Capacity */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Capacity <span className="text-red-600">*</span></label>
                        <input
                            type="number"
                            value={capacity}
                            onChange={e => setCapacity(e.target.value)}
                            placeholder="Maximum number of attendees"
                            min="1"
                            max="10000"
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${fieldErrors.capacity
                                ? 'border-red-500 focus:ring-red-500 bg-red-50'
                                : 'border-gray-300 focus:ring-primary-500 focus:border-transparent'
                                }`}
                        />
                        {fieldErrors.capacity && <p className="text-red-600 text-sm mt-1 flex items-center"><span className="mr-1">✕</span>{fieldErrors.capacity}</p>}
                        {!fieldErrors.capacity && <p className="text-gray-500 text-sm mt-1">Must be between 1 and 10,000</p>}
                    </div>

                    {/* Image Upload */}
                    <div className="border-t pt-8">
                        <label className="block text-sm font-semibold text-gray-700 mb-4">Event Image (Optional)</label>
                        <div className="space-y-4">
                            {/* Image Preview */}
                            {imagePreview && (
                                <div className="relative rounded-lg overflow-hidden shadow-md">
                                    <img
                                        src={imagePreview}
                                        alt="Event preview"
                                        className="w-full h-48 object-cover"
                                    />
                                    {imageFile && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setImageFile(null)
                                                setImagePreview('')
                                            }}
                                            className="absolute top-3 right-3 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition shadow-lg"
                                            title="Remove image"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* File Input */}
                            <div>
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition bg-gray-50">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <svg className="w-8 h-8 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                                        <p className="text-xs text-gray-500">JPG, PNG, GIF, WebP up to 5MB</p>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        disabled={uploadingImage || isSaving}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-8 border-t">
                        <button
                            type="submit"
                            disabled={isSaving || uploadingImage}
                            className={`flex-1 px-6 py-3 text-white font-semibold rounded-lg transition ${isSaving || uploadingImage
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
                                }`}
                        >
                            {isSaving ? '💾 Saving...' : isEditMode ? '✏️ Update Event' : '✨ Create Event'}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/admin/dashboard')}
                            disabled={isSaving}
                            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}