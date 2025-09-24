/**
 * Database schema initialization for SQLite
 * Defines tables, indexes, and constraints for photo album application
 */

/**
 * SQL statements for creating database schema
 */
export const SCHEMA_SQL = `
-- Albums table
CREATE TABLE IF NOT EXISTS albums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date_start DATE NOT NULL,
    date_end DATE NOT NULL,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    photo_count INTEGER DEFAULT 0,
    cover_photo_id INTEGER,
    FOREIGN KEY (cover_photo_id) REFERENCES photos(id) ON DELETE SET NULL,
    UNIQUE(name, date_start, date_end)
);

-- Photos table
CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL UNIQUE,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    date_taken DATETIME,
    date_imported TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    width INTEGER,
    height INTEGER,
    thumbnail_data BLOB,
    exif_data TEXT,
    album_id INTEGER NOT NULL,
    display_order INTEGER NOT NULL,
    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
);

-- Date groups table
CREATE TABLE IF NOT EXISTS date_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_type TEXT NOT NULL CHECK (group_type IN ('daily', 'monthly', 'yearly')),
    group_label TEXT NOT NULL,
    date_start DATE NOT NULL,
    date_end DATE NOT NULL,
    album_count INTEGER DEFAULT 0,
    UNIQUE(group_type, date_start, date_end)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_albums_date_start ON albums(date_start);
CREATE INDEX IF NOT EXISTS idx_albums_display_order ON albums(display_order);
CREATE INDEX IF NOT EXISTS idx_photos_album_id ON photos(album_id);
CREATE INDEX IF NOT EXISTS idx_photos_date_taken ON photos(date_taken);
CREATE INDEX IF NOT EXISTS idx_photos_display_order ON photos(album_id, display_order);
CREATE INDEX IF NOT EXISTS idx_date_groups_type_date ON date_groups(group_type, date_start);

-- Triggers for maintaining data integrity

-- Update album photo count when photos are inserted
CREATE TRIGGER IF NOT EXISTS update_photo_count_insert
AFTER INSERT ON photos
BEGIN
    UPDATE albums
    SET photo_count = photo_count + 1,
        cover_photo_id = CASE
            WHEN cover_photo_id IS NULL THEN NEW.id
            ELSE cover_photo_id
        END
    WHERE id = NEW.album_id;
END;

-- Update album photo count when photos are deleted
CREATE TRIGGER IF NOT EXISTS update_photo_count_delete
AFTER DELETE ON photos
BEGIN
    UPDATE albums
    SET photo_count = photo_count - 1,
        cover_photo_id = CASE
            WHEN cover_photo_id = OLD.id THEN (
                SELECT id FROM photos
                WHERE album_id = OLD.album_id AND id != OLD.id
                ORDER BY display_order LIMIT 1
            )
            ELSE cover_photo_id
        END
    WHERE id = OLD.album_id;
END;

-- Update date group album count when albums are inserted
CREATE TRIGGER IF NOT EXISTS update_group_count_insert
AFTER INSERT ON albums
BEGIN
    UPDATE date_groups
    SET album_count = album_count + 1
    WHERE date_start <= NEW.date_start AND date_end >= NEW.date_end;
END;

-- Update date group album count when albums are deleted
CREATE TRIGGER IF NOT EXISTS update_group_count_delete
AFTER DELETE ON albums
BEGIN
    UPDATE date_groups
    SET album_count = album_count - 1
    WHERE date_start <= OLD.date_start AND date_end >= OLD.date_end;
END;
`

/**
 * Initial data for date groups (monthly grouping)
 */
export const INITIAL_DATA_SQL = `
-- Create default "Undated" album for photos without valid dates
INSERT OR IGNORE INTO albums (name, date_start, date_end, display_order)
VALUES ('Undated', '1900-01-01', '1900-01-01', 999999);
`

/**
 * Schema version for migrations
 */
export const SCHEMA_VERSION = 1

/**
 * Initialize database schema
 * @param {Object} db - SQL.js database instance
 */
export function initializeSchema(db) {
  try {
    // Execute schema creation
    db.exec(SCHEMA_SQL)

    // Insert initial data
    db.exec(INITIAL_DATA_SQL)

    // Store schema version
    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_version (version INTEGER);
      INSERT OR REPLACE INTO schema_version (rowid, version) VALUES (1, ${SCHEMA_VERSION});
    `)

    return true
  } catch (error) {
    console.error('Failed to initialize database schema:', error)
    throw new Error(`Schema initialization failed: ${error.message}`)
  }
}

/**
 * Get current schema version
 * @param {Object} db - SQL.js database instance
 * @returns {number}
 */
export function getSchemaVersion(db) {
  try {
    const result = db.exec('SELECT version FROM schema_version LIMIT 1')
    return result.length > 0 ? result[0].values[0][0] : 0
  } catch {
    return 0
  }
}

/**
 * Check if schema needs migration
 * @param {Object} db - SQL.js database instance
 * @returns {boolean}
 */
export function needsMigration(db) {
  const currentVersion = getSchemaVersion(db)
  return currentVersion < SCHEMA_VERSION
}