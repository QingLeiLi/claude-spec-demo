/**
 * Album model - handles album data operations
 * Provides CRUD operations for photo albums
 */

export class Album {
  constructor(database) {
    this.db = database
  }

  /**
   * Create a new album
   * @param {Object} albumData - Album data
   * @param {string} albumData.name - Album name
   * @param {string} albumData.date_start - Start date (ISO string)
   * @param {string} albumData.date_end - End date (ISO string)
   * @param {number} [albumData.display_order] - Display order (auto-assigned if not provided)
   * @returns {Promise<Object>} Created album
   */
  async create(albumData) {
    const { name, date_start, date_end, display_order } = albumData

    // Validate required fields
    if (!name || !date_start || !date_end) {
      throw new Error('Album name, date_start, and date_end are required')
    }

    // Auto-assign display order if not provided
    let finalDisplayOrder = display_order
    if (!finalDisplayOrder) {
      const maxOrder = await this.getMaxDisplayOrder()
      finalDisplayOrder = maxOrder + 1
    }

    const sql = `
      INSERT INTO albums (name, date_start, date_end, display_order)
      VALUES (?, ?, ?, ?)
    `

    try {
      const result = this.db.exec(sql, [name, date_start, date_end, finalDisplayOrder])

      if (result.lastInsertRowid) {
        return await this.findById(result.lastInsertRowid)
      }

      throw new Error('Failed to create album')
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('Album with this name and date range already exists')
      }
      throw error
    }
  }

  /**
   * Find album by ID
   * @param {number} id - Album ID
   * @returns {Promise<Object|null>} Album or null if not found
   */
  async findById(id) {
    const sql = `
      SELECT a.*, p.id as cover_photo_id, p.thumbnail_data as cover_thumbnail
      FROM albums a
      LEFT JOIN photos p ON a.cover_photo_id = p.id
      WHERE a.id = ?
    `

    const results = this.db.query(sql, [id])
    if (results.length === 0) {
      return null
    }

    return this.formatAlbum(results[0])
  }

  /**
   * Find all albums ordered by display_order
   * @returns {Promise<Array>} List of albums
   */
  async findAll() {
    const sql = `
      SELECT a.*, p.id as cover_photo_id, p.thumbnail_data as cover_thumbnail
      FROM albums a
      LEFT JOIN photos p ON a.cover_photo_id = p.id
      ORDER BY a.display_order ASC
    `

    const results = this.db.query(sql)
    return results.map(row => this.formatAlbum(row))
  }

  /**
   * Find albums by date range
   * @param {string} startDate - Start date (ISO string)
   * @param {string} endDate - End date (ISO string)
   * @returns {Promise<Array>} List of albums
   */
  async findByDateRange(startDate, endDate) {
    const sql = `
      SELECT a.*, p.id as cover_photo_id, p.thumbnail_data as cover_thumbnail
      FROM albums a
      LEFT JOIN photos p ON a.cover_photo_id = p.id
      WHERE a.date_start >= ? AND a.date_end <= ?
      ORDER BY a.display_order ASC
    `

    const results = this.db.query(sql, [startDate, endDate])
    return results.map(row => this.formatAlbum(row))
  }

  /**
   * Update album
   * @param {number} id - Album ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object|null>} Updated album or null if not found
   */
  async update(id, updates) {
    const allowedFields = ['name', 'date_start', 'date_end', 'display_order', 'cover_photo_id']
    const updateFields = Object.keys(updates).filter(field => allowedFields.includes(field))

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update')
    }

    const setClause = updateFields.map(field => `${field} = ?`).join(', ')
    const values = updateFields.map(field => updates[field])

    const sql = `UPDATE albums SET ${setClause} WHERE id = ?`
    values.push(id)

    try {
      const result = this.db.exec(sql, values)

      if (result.changes > 0) {
        return await this.findById(id)
      }

      return null
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('Album with this name and date range already exists')
      }
      throw error
    }
  }

  /**
   * Delete album and all its photos
   * @param {number} id - Album ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    const sql = 'DELETE FROM albums WHERE id = ?'
    const result = this.db.exec(sql, [id])
    return result.changes > 0
  }

  /**
   * Update display order for album reordering
   * @param {number} albumId - Album to move
   * @param {number} newOrder - New display order
   * @returns {Promise<Array>} Updated albums with new order
   */
  async reorder(albumId, newOrder) {
    return await this.db.transaction(async () => {
      // Get current order
      const album = await this.findById(albumId)
      if (!album) {
        throw new Error('Album not found')
      }

      const currentOrder = album.display_order

      if (currentOrder === newOrder) {
        return await this.findAll()
      }

      // Shift other albums
      if (newOrder < currentOrder) {
        // Moving up - shift others down
        const sql = `
          UPDATE albums
          SET display_order = display_order + 1
          WHERE display_order >= ? AND display_order < ? AND id != ?
        `
        this.db.exec(sql, [newOrder, currentOrder, albumId])
      } else {
        // Moving down - shift others up
        const sql = `
          UPDATE albums
          SET display_order = display_order - 1
          WHERE display_order > ? AND display_order <= ? AND id != ?
        `
        this.db.exec(sql, [currentOrder, newOrder, albumId])
      }

      // Update the moved album
      await this.update(albumId, { display_order: newOrder })

      // Return updated list
      return await this.findAll()
    })
  }

  /**
   * Get maximum display order
   * @returns {Promise<number>} Maximum display order
   */
  async getMaxDisplayOrder() {
    const sql = 'SELECT COALESCE(MAX(display_order), 0) as max_order FROM albums'
    const result = this.db.query(sql)
    return result[0].max_order
  }

  /**
   * Find or create album for given date
   * @param {Date|string} date - Photo date
   * @returns {Promise<Object>} Album for the date
   */
  async findOrCreateForDate(date) {
    const photoDate = new Date(date)

    if (isNaN(photoDate.getTime())) {
      // Invalid date - use "Undated" album
      return await this.findOrCreateUndatedAlbum()
    }

    // Create monthly album
    const year = photoDate.getFullYear()
    const month = photoDate.getMonth() + 1
    const monthName = photoDate.toLocaleString('default', { month: 'long' })

    const albumName = `${monthName} ${year}`
    const dateStart = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const dateEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    // Try to find existing album
    const existingAlbums = await this.findByDateRange(dateStart, dateEnd)
    const existing = existingAlbums.find(album => album.name === albumName)

    if (existing) {
      return existing
    }

    // Create new album
    return await this.create({
      name: albumName,
      date_start: dateStart,
      date_end: dateEnd
    })
  }

  /**
   * Find or create "Undated" album
   * @returns {Promise<Object>} Undated album
   */
  async findOrCreateUndatedAlbum() {
    const sql = `
      SELECT a.*, p.id as cover_photo_id, p.thumbnail_data as cover_thumbnail
      FROM albums a
      LEFT JOIN photos p ON a.cover_photo_id = p.id
      WHERE a.name = 'Undated'
    `

    const results = this.db.query(sql)
    if (results.length > 0) {
      return this.formatAlbum(results[0])
    }

    // Should exist from schema initialization, but create if missing
    return await this.create({
      name: 'Undated',
      date_start: '1900-01-01',
      date_end: '1900-01-01'
    })
  }

  /**
   * Format album data for API response
   * @param {Object} row - Database row
   * @returns {Object} Formatted album
   */
  formatAlbum(row) {
    const album = {
      id: row.id,
      name: row.name,
      date_start: row.date_start,
      date_end: row.date_end,
      display_order: row.display_order,
      created_at: row.created_at,
      photo_count: row.photo_count || 0
    }

    // Add cover photo if available
    if (row.cover_photo_id && row.cover_thumbnail) {
      album.cover_photo = {
        id: row.cover_photo_id,
        thumbnail_data: row.cover_thumbnail
      }
    }

    return album
  }
}