# Photo API Contract

## POST /api/photos/import
**Purpose**: Import photos from local files with metadata extraction
**Request**: FormData with files
```javascript
const formData = new FormData();
formData.append('photos', file1);
formData.append('photos', file2);
// Additional files...
```
**Response**:
```json
{
  "imported": [
    {
      "id": 42,
      "file_name": "IMG_001.jpg",
      "album_id": 1,
      "date_taken": "2024-01-15T14:30:00Z",
      "thumbnail_data": "data:image/jpeg;base64,..."
    }
  ],
  "failed": [
    {
      "file_name": "corrupt.jpg",
      "error": "Invalid image format"
    }
  ],
  "total_imported": 1,
  "albums_created": 0,
  "albums_updated": 1
}
```

## GET /api/photos/{id}
**Purpose**: Get specific photo with full metadata
**Request**: Photo ID in path
**Response**:
```json
{
  "id": 42,
  "file_name": "IMG_001.jpg",
  "file_path": "blob:http://localhost:5173/...",
  "file_size": 2457600,
  "mime_type": "image/jpeg",
  "date_taken": "2024-01-15T14:30:00Z",
  "date_imported": "2024-01-15T16:00:00Z",
  "width": 1920,
  "height": 1080,
  "album_id": 1,
  "display_order": 1,
  "exif_data": {
    "camera": "Canon EOS R5",
    "lens": "RF 24-70mm f/2.8L IS USM",
    "iso": 400,
    "aperture": "f/2.8",
    "shutter_speed": "1/125"
  }
}
```

## GET /api/photos/{id}/thumbnail
**Purpose**: Get photo thumbnail for tile display
**Request**: Photo ID in path
**Response**: Binary image data (JPEG) or base64 data URL
```
Content-Type: image/jpeg
Content-Length: 15420
[Binary thumbnail data]
```

## PUT /api/photos/{id}/order
**Purpose**: Reorder photo within album
**Request**:
```json
{
  "new_order": 5,
  "moved_from": 2
}
```
**Response**:
```json
{
  "success": true,
  "updated_photos": [
    {"id": 42, "display_order": 5},
    {"id": 43, "display_order": 2},
    {"id": 44, "display_order": 3},
    {"id": 45, "display_order": 4}
  ]
}
```

## DELETE /api/photos/{id}
**Purpose**: Remove photo from album and delete file
**Request**: Photo ID in path
**Response**:
```json
{
  "success": true,
  "album_id": 1,
  "updated_photo_count": 14
}
```

## GET /api/photos/album/{album_id}
**Purpose**: Get all photos in specific album for tile view
**Request**: Album ID in path, optional pagination
**Query Parameters**:
- `page` (optional): Page number for pagination
- `limit` (optional): Photos per page (default 50)
**Response**:
```json
{
  "photos": [
    {
      "id": 42,
      "file_name": "IMG_001.jpg",
      "date_taken": "2024-01-15T14:30:00Z",
      "width": 1920,
      "height": 1080,
      "display_order": 1,
      "thumbnail_data": "data:image/jpeg;base64,..."
    }
  ],
  "total_count": 15,
  "page": 1,
  "total_pages": 1
}
```