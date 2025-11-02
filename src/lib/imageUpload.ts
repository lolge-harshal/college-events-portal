import { supabase } from './supabaseClient'

/**
 * Image Upload Utilities
 * 
 * Handles event image upload to Supabase storage and URL generation
 * 
 * Storage Bucket: "event-images"
 * Path structure: "events/{eventId}/{filename}"
 */

const BUCKET_NAME = 'event-images'
const SIGNED_URL_EXPIRY_SECONDS = 3600 * 24 * 7 // 7 days

/**
 * Upload image file to Supabase storage
 * 
 * @param eventId - Event ID (used for path organization)
 * @param file - Image file to upload
 * @returns Object with { path, publicUrl, or error }
 * 
 * @example
 * const result = await uploadEventImage(eventId, imageFile)
 * if (result.error) {
 *   console.error('Upload failed:', result.error)
 * } else {
 *   console.log('Uploaded to:', result.path)
 * }
 */
export async function uploadEventImage(eventId: string, file: File): Promise<{
    path?: string
    publicUrl?: string
    error?: Error | null
}> {
    try {
        // Validate file
        if (!file) {
            throw new Error('No file provided')
        }

        // Validate file type (only images)
        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if (!validImageTypes.includes(file.type)) {
            throw new Error(`Invalid file type. Allowed types: ${validImageTypes.join(', ')}`)
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024 // 5MB
        if (file.size > maxSize) {
            throw new Error('File size exceeds 5MB limit')
        }

        // Generate unique filename
        const timestamp = Date.now()
        const extension = file.name.split('.').pop() || 'jpg'
        const filename = `${timestamp}-${Math.random().toString(36).substring(2)}.${extension}`
        const path = `events/${eventId}/${filename}`

        console.log(`📤 Uploading image to: ${path}`)

        // Upload file to storage
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false,
            })

        if (error) {
            console.error('❌ Upload error:', error)
            throw error
        }

        if (!data) {
            throw new Error('No data returned from upload')
        }

        console.log('✅ Image uploaded successfully')

        // Return the storage path (not the public URL)
        // The app will use createSignedUrl() to generate temporary access URLs
        return {
            path: data.path,
        }
    } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        console.error('❌ Image upload failed:', error)
        return { error }
    }
}

/**
 * Generate signed URL for private image
 * 
 * Use this when the bucket is PRIVATE to generate temporary access URLs
 * The URL expires after SIGNED_URL_EXPIRY_SECONDS
 * 
 * @param imagePath - Path to image in storage (e.g., "events/{eventId}/{filename}")
 * @returns Signed URL string or null if error
 * 
 * @example
 * const url = await getSignedImageUrl(event.image_path)
 * if (url) {
 *   return <img src={url} alt="Event" />
 * }
 */
export async function getSignedImageUrl(imagePath: string | null | undefined): Promise<string | null> {
    if (!imagePath) {
        return null
    }

    try {
        console.log(`🔗 Generating signed URL for: ${imagePath}`)

        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(imagePath, SIGNED_URL_EXPIRY_SECONDS)

        if (error) {
            console.error('❌ Error generating signed URL:', error)
            return null
        }

        if (!data?.signedUrl) {
            console.error('❌ No signed URL returned')
            return null
        }

        console.log('✅ Signed URL generated')
        return data.signedUrl
    } catch (err) {
        console.error('❌ Error generating signed URL:', err)
        return null
    }
}

/**
 * Get public URL for image (use if bucket is PUBLIC)
 * 
 * Only use this if your bucket is set to public in Supabase
 * For private buckets, use getSignedImageUrl() instead
 * 
 * @param imagePath - Path to image in storage
 * @returns Public URL string
 * 
 * @example
 * const url = getPublicImageUrl(event.image_path)
 */
export function getPublicImageUrl(imagePath: string | null | undefined): string | null {
    if (!imagePath) {
        return null
    }

    try {
        const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(imagePath)

        if (!data?.publicUrl) {
            console.error('❌ No public URL returned')
            return null
        }

        console.log('✅ Public URL generated')
        return data.publicUrl
    } catch (err) {
        console.error('❌ Error generating public URL:', err)
        return null
    }
}

/**
 * Delete image from storage
 * 
 * @param imagePath - Path to image to delete
 * @returns { success: boolean, error?: Error }
 */
export async function deleteEventImage(imagePath: string): Promise<{
    success: boolean
    error?: Error | null
}> {
    try {
        if (!imagePath) {
            return { success: true } // No image to delete
        }

        console.log(`🗑️  Deleting image: ${imagePath}`)

        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([imagePath])

        if (error) {
            console.error('❌ Delete error:', error)
            throw error
        }

        console.log('✅ Image deleted successfully')
        return { success: true }
    } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        console.error('❌ Image deletion failed:', error)
        return { success: false, error }
    }
}

/**
 * Placeholder image URL (fallback when no image available)
 */
export const PLACEHOLDER_IMAGE_URL = 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop'