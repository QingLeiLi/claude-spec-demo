/**
 * Main application entry point
 * Initializes the photo album application
 */

import { App } from './components/app.js'

let app = null

/**
 * Initialize application
 */
async function initApp() {
  try {
    app = new App()
    await app.init()
    console.log('Photo Album App initialized successfully')
    return app
  } catch (error) {
    console.error('Failed to initialize app:', error)
    throw error
  }
}

/**
 * Get app instance
 */
export function getApp() {
  return app
}

// Initialize app if in browser environment
if (typeof window !== 'undefined') {
  initApp().catch(console.error)
}

export { initApp }