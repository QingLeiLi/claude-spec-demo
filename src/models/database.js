/**
 * Database class - manages SQLite database instance and connections
 * Handles initialization, migrations, and persistence via SQL.js and IndexedDB
 */

import initSqlJs from 'sql.js'
import { storage } from '../lib/storage.js'
import { initializeSchema, needsMigration, SCHEMA_VERSION } from './schema.js'

export class Database {
  constructor() {
    this.db = null
    this.SQL = null
    this.isInitialized = false
  }

  /**
   * Initialize database connection and load SQL.js
   * @returns {Promise<void>}
   */
  async init() {
    try {
      // Initialize SQL.js
      this.SQL = await initSqlJs({
        locateFile: file => `/node_modules/sql.js/dist/${file}`
      })

      // Initialize storage
      await storage.init()

      // Load existing database or create new one
      await this.loadOrCreateDatabase()

      this.isInitialized = true
    } catch (error) {
      console.error('Database initialization failed:', error)
      throw new Error(`Database initialization failed: ${error.message}`)
    }
  }

  /**
   * Load existing database from storage or create new one
   * @private
   */
  async loadOrCreateDatabase() {
    try {
      const existingData = await storage.loadDatabase()

      if (existingData) {
        // Load existing database
        this.db = new this.SQL.Database(existingData)

        // Check if migration is needed
        if (needsMigration(this.db)) {
          await this.migrate()
        }
      } else {
        // Create new database
        this.db = new this.SQL.Database()
        initializeSchema(this.db)
        await this.saveDatabase()
      }
    } catch (error) {
      console.error('Failed to load or create database:', error)
      throw error
    }
  }

  /**
   * Migrate database to current schema version
   * @private
   */
  async migrate() {
    try {
      // For now, just reinitialize schema
      // In production, would implement proper migration logic
      initializeSchema(this.db)
      await this.saveDatabase()
    } catch (error) {
      console.error('Database migration failed:', error)
      throw error
    }
  }

  /**
   * Save database to persistent storage
   */
  async saveDatabase() {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    try {
      const data = this.db.export()
      await storage.saveDatabase(data)
    } catch (error) {
      console.error('Failed to save database:', error)
      throw error
    }
  }

  /**
   * Execute SQL query with parameters
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Array} Query results
   */
  query(sql, params = []) {
    if (!this.isInitialized) {
      throw new Error('Database not initialized')
    }

    try {
      const stmt = this.db.prepare(sql)
      const results = []

      while (stmt.step()) {
        const row = stmt.getAsObject()
        results.push(row)
      }

      stmt.free()
      return results
    } catch (error) {
      console.error('Query failed:', error)
      throw new Error(`Query failed: ${error.message}`)
    }
  }

  /**
   * Execute SQL statement (INSERT, UPDATE, DELETE)
   * @param {string} sql - SQL statement
   * @param {Array} params - Statement parameters
   * @returns {Object} Execution result with lastInsertRowid, changes
   */
  exec(sql, params = []) {
    if (!this.isInitialized) {
      throw new Error('Database not initialized')
    }

    try {
      const stmt = this.db.prepare(sql)
      const result = stmt.run(params)
      stmt.free()

      return {
        lastInsertRowid: this.db.getRowsModified() > 0 ? result.lastInsertRowid || null : null,
        changes: this.db.getRowsModified()
      }
    } catch (error) {
      console.error('Execution failed:', error)
      throw new Error(`Execution failed: ${error.message}`)
    }
  }

  /**
   * Begin database transaction
   */
  beginTransaction() {
    this.exec('BEGIN TRANSACTION')
  }

  /**
   * Commit database transaction
   */
  commitTransaction() {
    this.exec('COMMIT')
  }

  /**
   * Rollback database transaction
   */
  rollbackTransaction() {
    this.exec('ROLLBACK')
  }

  /**
   * Execute function within transaction
   * @param {Function} fn - Function to execute in transaction
   * @returns {Promise<any>} Function result
   */
  async transaction(fn) {
    this.beginTransaction()

    try {
      const result = await fn()
      this.commitTransaction()
      await this.saveDatabase()
      return result
    } catch (error) {
      this.rollbackTransaction()
      throw error
    }
  }

  /**
   * Get database statistics
   * @returns {Object} Database statistics
   */
  getStats() {
    if (!this.isInitialized) {
      return null
    }

    try {
      const albumCount = this.query('SELECT COUNT(*) as count FROM albums')[0].count
      const photoCount = this.query('SELECT COUNT(*) as count FROM photos')[0].count
      const dbSize = this.db.export().length

      return {
        albums: albumCount,
        photos: photoCount,
        databaseSize: dbSize,
        schemaVersion: SCHEMA_VERSION
      }
    } catch (error) {
      console.error('Failed to get database stats:', error)
      return null
    }
  }

  /**
   * Clear all data from database
   */
  async clear() {
    if (!this.isInitialized) {
      throw new Error('Database not initialized')
    }

    try {
      await this.transaction(() => {
        this.exec('DELETE FROM photos')
        this.exec('DELETE FROM albums')
        this.exec('DELETE FROM date_groups')
        this.exec('DELETE FROM sqlite_sequence') // Reset auto-increment
      })
    } catch (error) {
      console.error('Failed to clear database:', error)
      throw error
    }
  }

  /**
   * Close database connection and cleanup
   */
  async close() {
    if (this.db) {
      try {
        await this.saveDatabase()
        this.db.close()
      } catch (error) {
        console.error('Error during database close:', error)
      } finally {
        this.db = null
        this.isInitialized = false
      }
    }

    storage.close()
  }

  /**
   * Check if database is ready for operations
   * @returns {boolean}
   */
  isReady() {
    return this.isInitialized && this.db !== null
  }
}