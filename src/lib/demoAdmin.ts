/**
 * Demo Admin Credentials for Testing
 * 
 * Use these credentials to quickly test admin features without manually setting is_admin in database
 */

export const DEMO_ADMIN_CREDENTIALS = {
    email: 'admin@demo.college-events.edu',
    password: 'DemoAdmin@123',
    displayName: 'Demo Admin'
}

/**
 * Quick reference for demo accounts
 */
export const DEMO_ACCOUNTS = [
    {
        role: 'Admin',
        email: DEMO_ADMIN_CREDENTIALS.email,
        password: DEMO_ADMIN_CREDENTIALS.password,
        features: [
            'View all events',
            'Create/Edit/Delete any event',
            'Manage all registrations',
            'Access admin dashboard',
            'Export registrations to CSV'
        ]
    },
    {
        role: 'Organizer',
        email: 'organizer@demo.college-events.edu',
        password: 'OrganizerDemo@123',
        features: [
            'Create/Edit/Delete own events',
            'Manage own event registrations',
            'Cannot see other organizer\'s events'
        ]
    },
    {
        role: 'Student',
        email: 'student@demo.college-events.edu',
        password: 'StudentDemo@123',
        features: [
            'View all events',
            'Register for events',
            'View own registrations'
        ]
    }
]