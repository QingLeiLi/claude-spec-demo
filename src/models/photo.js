/**
 * Photo model - handles photo data operations
 * Provides CRUD operations for photos
 */

export class Photo {
  constructor(database) {
    this.db = database
  }

  /**
   * Create a new photo
   * @param {Object} photoData - Photo data
   * @returns {Promise<Object>} Created photo
   */
  async create(photoData) {
    const {
      file_name,
      file_path,
      file_size,
      mime_type,
      date_taken,
      width,
      height,
      thumbnail_data,
      exif_data,
      album_id,
      display_order
    } = photoData

    // Validate required fields
    if (!file_name || !file_path || !file_size || !mime_type || !album_id) {
      throw new Error('file_name, file_path, file_size, mime_type, and album_id are required')
    }

    // Auto-assign display order if not provided
    let finalDisplayOrder = display_order
    if (!finalDisplayOrder) {
      const maxOrder = await this.getMaxDisplayOrderInAlbum(album_id)
      finalDisplayOrder = maxOrder + 1
    }

    const sql = `
      INSERT INTO photos (
        file_name, file_path, file_size, mime_type, date_taken,
        width, height, thumbnail_data, exif_data, album_id, display_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    try {
      const result = this.db.exec(sql, [
        file_name,
        file_path,
        file_size,
        mime_type,
        date_taken,
        width,
        height,
        thumbnail_data,
        exif_data ? JSON.stringify(exif_data) : null,
        album_id,
        finalDisplayOrder
      ])

      if (result.lastInsertRowid) {
        return await this.findById(result.lastInsertRowid)
      }

      throw new Error('Failed to create photo')
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('Photo with this file path already exists')
      }
      throw error
    }
  }

  /**
   * Find photo by ID
   * @param {number} id - Photo ID
   * @returns {Promise<Object|null>} Photo or null if not found
   */
  async findById(id) {
    const sql = 'SELECT * FROM photos WHERE id = ?'
    const results = this.db.query(sql, [id])

    if (results.length === 0) {
      return null
    }

    return this.formatPhoto(results[0])
  }

  /**
   * Find all photos in an album
   * @param {number} albumId - Album ID
   * @param {Object} options - Query options
   * @param {number} [options.limit] - Limit number of results
   * @param {number} [options.offset] - Offset for pagination
   * @returns {Promise<Array>} List of photos
   */
  async findByAlbum(albumId, options = {}) {
    const { limit, offset } = options

    let sql = `
      SELECT * FROM photos
      WHERE album_id = ?
      ORDER BY display_order ASC
    `

    const params = [albumId]

    if (limit) {
      sql += ' LIMIT ?'
      params.push(limit)

      if (offset) {
        sql += ' OFFSET ?'
        params.push(offset)
      }
    }

    const results = this.db.query(sql, params)
    return results.map(row => this.formatPhoto(row))
  }

  /**
   * Find photos by date range
   * @param {string} startDate - Start date (ISO string)
   * @param {string} endDate - End date (ISO string)
   * @returns {Promise<Array>} List of photos
   */
  async findByDateRange(startDate, endDate) {
    const sql = `
      SELECT * FROM photos
      WHERE date_taken >= ? AND date_taken <= ?
      ORDER BY date_taken ASC
    `

    const results = this.db.query(sql, [startDate, endDate])
    return results.map(row => this.formatPhoto(row))
  }

  /**
   * Search photos by criteria
   * @param {Object} criteria - Search criteria
   * @param {string} [criteria.filename] - Search by filename
   * @param {Object} [criteria.dateRange] - Date range filter
   * @param {Array<number>} [criteria.albumIds] - Filter by album IDs
   * @returns {Promise<Array>} Matching photos
   */
  async search(criteria = {}) {
    let sql = 'SELECT * FROM photos WHERE 1=1'
    const params = []

    if (criteria.filename) {
      sql += ' AND file_name LIKE ?'
      params.push(`%${criteria.filename}%`)
    }

    if (criteria.dateRange) {
      if (criteria.dateRange.start) {
        sql += ' AND date_taken >= ?'
        params.push(criteria.dateRange.start)
      }
      if (criteria.dateRange.end) {
        sql += ' AND date_taken <= ?'
        params.push(criteria.dateRange.end)
      }
    }

    if (criteria.albumIds && criteria.albumIds.length > 0) {
      const placeholders = criteria.albumIds.map(() => '?').join(',')
      sql += ` AND album_id IN (${placeholders})`
      params.push(...criteria.albumIds)
    }

    sql += ' ORDER BY date_taken DESC'

    const results = this.db.query(sql, params)
    return results.map(row => this.formatPhoto(row))
  }

  /**
   * Update photo
   * @param {number} id - Photo ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object|null>} Updated photo or null if not found
   */
  async update(id, updates) {
    const allowedFields = [
      'file_name',
      'file_path',
      'file_size',
      'mime_type',
      'date_taken',
      'width',
      'height',
      'thumbnail_data',
      'exif_data',
      'album_id',
      'display_order'
    ]

    const updateFields = Object.keys(updates).filter(field => allowedFields.includes(field))

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update')
    }

    const setClause = updateFields.map(field => `${field} = ?`).join(', ')
    const values = updateFields.map(field => {
      if (field === 'exif_data' && typeof updates[field] === 'object') {
        return JSON.stringify(updates[field])
      }
      return updates[field]
    })

    const sql = `UPDATE photos SET ${setClause} WHERE id = ?`
    values.push(id)

    try {
      const result = this.db.exec(sql, values)

      if (result.changes > 0) {
        return await this.findById(id)
      }

      return null
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('Photo with this file path already exists')
      }
      throw error
    }
  }

  /**
   * Delete photo
   * @param {number} id - Photo ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    const sql = 'DELETE FROM photos WHERE id = ?'
    const result = this.db.exec(sql, [id])
    return result.changes > 0
  }

  /**
   * Reorder photo within album
   * @param {number} photoId - Photo to move
   * @param {number} newOrder - New display order
   * @returns {Promise<Array>} Updated photos in album
   */
  async reorder(photoId, newOrder) {
    return await this.db.transaction(async () => {
      // Get current photo and album
      const photo = await this.findById(photoId)
      if (!photo) {
        throw new Error('Photo not found')
      }

      const currentOrder = photo.display_order
      const albumId = photo.album_id

      if (currentOrder === newOrder) {
        return await this.findByAlbum(albumId)
      }

      // Shift other photos in the same album
      if (newOrder < currentOrder) {
        // Moving up - shift others down
        const sql = `
          UPDATE photos
          SET display_order = display_order + 1
          WHERE album_id = ? AND display_order >= ? AND display_order < ? AND id != ?
        `
        this.db.exec(sql, [albumId, newOrder, currentOrder, photoId])
      } else {
        // Moving down - shift others up
        const sql = `
          UPDATE photos
          SET display_order = display_order - 1
          WHERE album_id = ? AND display_order > ? AND display_order <= ? AND id != ?
        `
        this.db.exec(sql, [albumId, currentOrder, newOrder, photoId])
      }

      // Update the moved photo
      await this.update(photoId, { display_order: newOrder })

      // Return updated album photos
      return await this.findByAlbum(albumId)
    })
  }

  /**
   * Get maximum display order in album
   * @param {number} albumId - Album ID
   * @returns {Promise<number>} Maximum display order
   */
  async getMaxDisplayOrderInAlbum(albumId) {
    const sql = 'SELECT COALESCE(MAX(display_order), 0) as max_order FROM photos WHERE album_id = ?'
    const result = this.db.query(sql, [albumId])
    return result[0].max_order
  }

  /**
   * Count photos in album
   * @param {number} albumId - Album ID
   * @returns {Promise<number>} Photo count
   */
  async countByAlbum(albumId) {
    const sql = 'SELECT COUNT(*) as count FROM photos WHERE album_id = ?'
    const result = this.db.query(sql, [albumId])
    return result[0].count
  }

  /**
   * Get photo statistics
   * @returns {Promise<Object>} Photo statistics
   */
  async getStats() {
    const sql = `
      SELECT
        COUNT(*) as total_photos,
        COUNT(DISTINCT album_id) as albums_with_photos,
        AVG(file_size) as avg_file_size,
        SUM(file_size) as total_file_size,
        MIN(date_taken) as earliest_photo,
        MAX(date_taken) as latest_photo
      FROM photos
      WHERE date_taken IS NOT NULL
    `

    const result = this.db.query(sql)
    return result[0] || {}
  }

  /**
   * Format photo data for API response
   * @param {Object} row - Database row
   * @returns {Object} Formatted photo
   */
  formatPhoto(row) {
    const photo = {
      id: row.id,
      file_name: row.file_name,
      file_path: row.file_path,
      file_size: row.file_size,
      mime_type: row.mime_type,
      date_taken: row.date_taken,
      date_imported: row.date_imported,
      width: row.width,
      height: row.height,
      thumbnail_data: row.thumbnail_data,
      album_id: row.album_id,
      display_order: row.display_order
    }

    // Parse EXIF data if available
    if (row.exif_data) {
      try {
        photo.exif_data = JSON.parse(row.exif_data)
      } catch {
        photo.exif_data = null
      }
    }

    return photo
  }
}