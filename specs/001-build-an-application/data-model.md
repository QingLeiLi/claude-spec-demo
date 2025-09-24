# Data Model: Photo Album Organization Application

## Entity Definitions

### Album
**Purpose**: Represents a collection of photos grouped by date with user-defined ordering
**Fields**:
- `id` (INTEGER PRIMARY KEY): Unique album identifier
- `name` (TEXT NOT NULL): Display name (e.g., "January 2024", "Summer Vacation")
- `date_start` (DATE NOT NULL): Start date for album grouping
- `date_end` (DATE NOT NULL): End date for album grouping
- `display_order` (INTEGER NOT NULL): User-defined order for drag-and-drop positioning
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP): Album creation timestamp
- `photo_count` (INTEGER DEFAULT 0): Cached count of photos in album
- `cover_photo_id` (INTEGER): Reference to photo used as album cover

**Validation Rules**:
- Album names must be unique within the same date range
- `date_end` must be >= `date_start`
- `display_order` must be positive integer
- `cover_photo_id` must reference existing photo in album

**State Transitions**:
- Created → Populated (photos added)
- Populated → Reordered (display_order changed)
- Any state → Deleted (with cascade delete of associations)

### Photo
**Purpose**: Individual image file with metadata and relationship to albums
**Fields**:
- `id` (INTEGER PRIMARY KEY): Unique photo identifier
- `file_name` (TEXT NOT NULL): Original filename
- `file_path` (TEXT NOT NULL): Local file system path or blob URL
- `file_size` (INTEGER NOT NULL): File size in bytes
- `mime_type` (TEXT NOT NULL): Image MIME type (image/jpeg, image/png, etc.)
- `date_taken` (DATETIME): EXIF date or file creation date
- `date_imported` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP): Import timestamp
- `width` (INTEGER): Image width in pixels
- `height` (INTEGER): Image height in pixels
- `thumbnail_data` (BLOB): Base64 encoded thumbnail image
- `exif_data` (TEXT): JSON string of EXIF metadata
- `album_id` (INTEGER NOT NULL): Foreign key to albums table
- `display_order` (INTEGER NOT NULL): Order within album

**Validation Rules**:
- `file_path` must be unique
- `mime_type` must be valid image type
- `width` and `height` must be positive integers
- `album_id` must reference existing album
- `display_order` must be positive within album context

**Relationships**:
- Belongs to one Album (many-to-one)
- One photo can be cover photo for one album (one-to-one optional)

### DateGroup
**Purpose**: Logical grouping metadata for organizing albums by date ranges
**Fields**:
- `id` (INTEGER PRIMARY KEY): Unique group identifier
- `group_type` (TEXT NOT NULL): Grouping strategy ('daily', 'monthly', 'yearly')
- `group_label` (TEXT NOT NULL): Display label (e.g., "January 2024", "Week of Jan 15")
- `date_start` (DATE NOT NULL): Group start date
- `date_end` (DATE NOT NULL): Group end date
- `album_count` (INTEGER DEFAULT 0): Number of albums in this group

**Validation Rules**:
- `group_type` must be one of: 'daily', 'monthly', 'yearly'
- `date_end` must be >= `date_start`
- Group date ranges must not overlap for same group_type

**Relationships**:
- Has many Albums (one-to-many)

## Database Schema

```sql
-- Albums table
CREATE TABLE albums (
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
CREATE TABLE photos (
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
CREATE TABLE date_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_type TEXT NOT NULL CHECK (group_type IN ('daily', 'monthly', 'yearly')),
    group_label TEXT NOT NULL,
    date_start DATE NOT NULL,
    date_end DATE NOT NULL,
    album_count INTEGER DEFAULT 0,
    UNIQUE(group_type, date_start, date_end)
);

-- Indexes for performance
CREATE INDEX idx_albums_date_start ON albums(date_start);
CREATE INDEX idx_albums_display_order ON albums(display_order);
CREATE INDEX idx_photos_album_id ON photos(album_id);
CREATE INDEX idx_photos_date_taken ON photos(date_taken);
CREATE INDEX idx_photos_display_order ON photos(album_id, display_order);
CREATE INDEX idx_date_groups_type_date ON date_groups(group_type, date_start);
```

## Business Logic Rules

### Album Creation
1. Photos imported automatically trigger album creation based on date_taken
2. Album names generated from date ranges (e.g., "January 2024")
3. Albums assigned incremental display_order on creation
4. First photo in album becomes cover_photo_id by default

### Photo Import Process
1. Extract EXIF data and determine date_taken
2. Find or create album for photo's date
3. Generate thumbnail and store as blob
4. Assign display_order as next sequence in album
5. Update album's photo_count and set cover photo if first

### Drag and Drop Reordering
1. Update display_order for moved album
2. Cascade updates to affected albums' display_order
3. Maintain sequential ordering without gaps
4. Persist changes immediately to database

### Data Integrity Constraints
1. Deleting album cascades to delete all contained photos
2. Deleting photo updates album's photo_count
3. Album cover_photo_id automatically updates if cover photo deleted
4. Date group album counts automatically maintained via triggers

## Performance Considerations

### Query Optimization
- Albums ordered by display_order for main page rendering
- Photos within albums ordered by display_order for tile interface
- Date-based queries use indexed date_taken field
- Thumbnail data loaded separately for memory efficiency

### Data Loading Strategy
- Main page loads album metadata only (no photo data)
- Album view loads photo metadata with lazy thumbnail loading
- Large collections use virtual scrolling and pagination
- Background processes for thumbnail generation and metadata extraction