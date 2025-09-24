/**
 * DateGroup model - handles date-based album grouping
 * Provides operations for organizing albums by date ranges
 */

export class DateGroup {
  constructor(database) {
    this.db = database
  }

  /**
   * Create a new date group
   * @param {Object} groupData - Group data
   * @returns {Promise<Object>} Created group
   */
  async create(groupData) {
    const { group_type, group_label, date_start, date_end } = groupData

    if (!group_type || !group_label || !date_start || !date_end) {
      throw new Error('All fields are required')
    }

    const sql = `
      INSERT INTO date_groups (group_type, group_label, date_start, date_end)
      VALUES (?, ?, ?, ?)
    `

    try {
      const result = this.db.exec(sql, [group_type, group_label, date_start, date_end])
      if (result.lastInsertRowid) {
        return await this.findById(result.lastInsertRowid)
      }
      throw new Error('Failed to create date group')
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('Date group with this type and date range already exists')
      }
      throw error
    }
  }

  /**
   * Find date group by ID
   * @param {number} id - Group ID
   * @returns {Promise<Object|null>} Group or null
   */
  async findById(id) {
    const sql = 'SELECT * FROM date_groups WHERE id = ?'
    const results = this.db.query(sql, [id])
    return results.length > 0 ? results[0] : null
  }

  /**
   * Find all date groups by type
   * @param {string} groupType - Group type (daily, monthly, yearly)
   * @returns {Promise<Array>} List of groups
   */
  async findByType(groupType) {
    const sql = `
      SELECT * FROM date_groups
      WHERE group_type = ?
      ORDER BY date_start ASC
    `
    return this.db.query(sql, [groupType])
  }

  /**
   * Get monthly groups for year
   * @param {number} year - Year
   * @returns {Promise<Array>} Monthly groups
   */
  async getMonthlyGroups(year) {
    const sql = `
      SELECT * FROM date_groups
      WHERE group_type = 'monthly'
      AND strftime('%Y', date_start) = ?
      ORDER BY date_start ASC
    `
    return this.db.query(sql, [year.toString()])
  }
}