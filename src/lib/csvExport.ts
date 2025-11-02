/**
 * CSV Export Utilities
 * 
 * Provides functions to export registration data to CSV format
 */

/**
 * Registration data structure for export
 */
export interface RegistrationExportData {
    profile_name: string
    email: string
    registered_at: string
    status: string
    notes: string | null
}

/**
 * Convert data array to CSV string
 * 
 * @param data - Array of registration data
 * @returns CSV string with headers and data rows
 */
export function convertToCSV(data: RegistrationExportData[]): string {
    if (data.length === 0) {
        return 'No data to export'
    }

    // Define CSV headers
    const headers = ['Profile Name', 'Email', 'Registered At', 'Status', 'Notes']

    // Escape CSV values to handle commas, quotes, and newlines
    const escapeCSVValue = (value: string | null): string => {
        if (value === null || value === undefined) {
            return ''
        }

        const stringValue = String(value)

        // If value contains comma, newline, or quote, wrap in quotes and escape inner quotes
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"` // Escape quotes by doubling them
        }

        return stringValue
    }

    // Create CSV header row
    const headerRow = headers.join(',')

    // Create CSV data rows
    const dataRows = data.map((row) => {
        return [
            escapeCSVValue(row.profile_name),
            escapeCSVValue(row.email),
            escapeCSVValue(row.registered_at),
            escapeCSVValue(row.status),
            escapeCSVValue(row.notes),
        ].join(',')
    })

    // Combine header and data rows
    return [headerRow, ...dataRows].join('\n')
}

/**
 * Download CSV file to user's computer
 * 
 * @param csvContent - CSV string content
 * @param filename - Filename for downloaded file (default: registrations.csv)
 */
export function downloadCSV(csvContent: string, filename: string = 'registrations.csv'): void {
    // Create blob from CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

    // Create temporary URL for blob
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    // Set link properties and trigger download
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'

    // Append to DOM (required for Firefox) and click
    document.body.appendChild(link)
    link.click()

    // Cleanup
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

/**
 * Export registrations to CSV and trigger download
 * 
 * @param registrations - Array of registration data
 * @param eventTitle - Event title for filename
 */
export function exportRegistrationsToCSV(registrations: RegistrationExportData[], eventTitle: string): void {
    const csvContent = convertToCSV(registrations)

    // Create filename with event title and timestamp
    const sanitizedTitle = eventTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()
    const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const filename = `registrations-${sanitizedTitle}-${timestamp}.csv`

    downloadCSV(csvContent, filename)
}