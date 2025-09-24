/**
 * IndexedDB wrapper for SQL.js persistence
 * Provides storage and retrieval of SQLite database file
 */

const DB_NAME = 'PhotoAlbumDB'
const DB_VERSION = 1
const STORE_NAME = 'sqlite_data'
const DB_KEY = 'database_file'

export class Storage {
  constructor() {
    this.db = null
  }

  /**
   * Initialize IndexedDB connection
   * @returns {Promise<void>}
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(new Error('Failed to open IndexedDB'))

      request.onsuccess = event => {
        this.db = event.target.result
        resolve()
      }

      request.onupgradeneeded = event => {
        const db = event.target.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      }
    })
  }

  /**
   * Save SQLite database file to IndexedDB
   * @param {Uint8Array} data - SQLite database binary data
   * @returns {Promise<void>}
   */
  async saveDatabase(data) {
    if (!this.db) {
      throw new Error('Storage not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      const request = store.put(data, DB_KEY)

      request.onerror = () => reject(new Error('Failed to save database'))
      request.onsuccess = () => resolve()
    })
  }

  /**
   * Load SQLite database file from IndexedDB
   * @returns {Promise<Uint8Array|null>}
   */
  async loadDatabase() {
    if (!this.db) {
      throw new Error('Storage not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)

      const request = store.get(DB_KEY)

      request.onerror = () => reject(new Error('Failed to load database'))
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  /**
   * Clear all stored data
   * @returns {Promise<void>}
   */
  async clear() {
    if (!this.db) {
      throw new Error('Storage not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      const request = store.clear()

      request.onerror = () => reject(new Error('Failed to clear database'))
      request.onsuccess = () => resolve()
    })
  }

  /**
   * Check if database exists in storage
   * @returns {Promise<boolean>}
   */
  async exists() {
    try {
      const data = await this.loadDatabase()
      return data !== null
    } catch {
      return false
    }
  }

  /**
   * Close IndexedDB connection
   */
  close() {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}

// Export singleton instance
export const storage = new Storage()