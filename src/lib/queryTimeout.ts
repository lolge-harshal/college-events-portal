/**
 * Supabase response structure with data, error, and status
 */
export interface SupabaseResponse<T> {
    data: T | null
    error: any | null
    status?: number
    statusText?: string
    count?: number | null
}

/**
 * Utility function to add timeout to Supabase queries
 * Prevents queries from hanging indefinitely
 * Preserves the Supabase response structure
 */
export function withTimeout<T>(
    query: Promise<any> | any,
    timeoutMs: number = 20000  // Increased from 10s to 20s for better reliability
): Promise<SupabaseResponse<T>> {
    // Convert to Promise if it's a Postgrest builder
    const actualPromise = Promise.resolve(query)

    return Promise.race([
        actualPromise,
        new Promise<SupabaseResponse<T>>((_resolve, reject) =>
            setTimeout(
                () =>
                    reject(
                        new Error(
                            `Query timeout after ${timeoutMs}ms. The server is not responding. ` +
                            'This usually means: 1) Supabase is unreachable, 2) RLS policies are blocking access, ' +
                            '3) Network is slow, or 4) Check your Supabase dashboard for status issues.'
                        )
                    ),
                timeoutMs
            )
        ),
    ]) as Promise<SupabaseResponse<T>>
}