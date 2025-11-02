import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
    // ============================================================================
    // HMR Configuration - PREVENT AUTO-REFRESH ON TAB/WINDOW SWITCH
    // ============================================================================
    // The key is to configure HMR to NOT reload when connection is lost/restored
    // This prevents the browser from auto-refreshing when switching windows
    hmr: {
      host: 'localhost',
      port: 5173,
      protocol: 'ws',
      // CRITICAL: Set timeout to allow long periods of disconnection
      // This prevents forced reconnects when switching tabs/windows
      timeout: 120000, // 2 minutes before giving up on connection
    },
    // ============================================================================
    // File Watching Configuration - PREVENT AGGRESSIVE POLLING
    // ============================================================================
    // Disable polling - rely on native file system events (inotify on Mac/Linux)
    watch: {
      usePolling: false,
      // Only watch source files, not build artifacts or dependencies
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/.DS_Store',
        '**/coverage/**',
      ],
      // Allow stable detection of real changes
      stabilityThreshold: 300, // Wait 300ms after change before triggering rebuild
    },
  },
})