# Album API Contract

## GET /api/albums
**Purpose**: Retrieve all albums ordered by display_order for main page
**Request**: No parameters
**Response**:
```json
{
  "albums": [
    {
      "id": 1,
      "name": "January 2024",
      "date_start": "2024-01-01",
      "date_end": "2024-01-31",
      "display_order": 1,
      "photo_count": 15,
      "cover_photo": {
        "id": 42,
        "thumbnail_data": "data:image/jpeg;base64,..."
      }
    }
  ],
  "total_count": 5
}
```

## GET /api/albums/{id}
**Purpose**: Get specific album with metadata for album view
**Request**: Album ID in path
**Response**:
```json
{
  "id": 1,
  "name": "January 2024",
  "date_start": "2024-01-01",
  "date_end": "2024-01-31",
  "display_order": 1,
  "created_at": "2024-01-01T10:00:00Z",
  "photo_count": 15,
  "photos": [
    {
      "id": 42,
      "file_name": "IMG_001.jpg",
      "date_taken": "2024-01-15T14:30:00Z",
      "width": 1920,
      "height": 1080,
      "display_order": 1
    }
  ]
}
```

## PUT /api/albums/{id}/order
**Purpose**: Update album display order after drag-and-drop
**Request**:
```json
{
  "new_order": 3,
  "moved_from": 1
}
```
**Response**:
```json
{
  "success": true,
  "updated_albums": [
    {"id": 1, "display_order": 3},
    {"id": 2, "display_order": 1},
    {"id": 3, "display_order": 2}
  ]
}
```

## POST /api/albums
**Purpose**: Create new album (triggered by photo import)
**Request**:
```json
{
  "name": "February 2024",
  "date_start": "2024-02-01",
  "date_end": "2024-02-29"
}
```
**Response**:
```json
{
  "id": 6,
  "name": "February 2024",
  "date_start": "2024-02-01",
  "date_end": "2024-02-29",
  "display_order": 6,
  "created_at": "2024-02-01T10:00:00Z",
  "photo_count": 0
}
```

## DELETE /api/albums/{id}
**Purpose**: Delete album and all contained photos
**Request**: Album ID in path
**Response**:
```json
{
  "success": true,
  "deleted_photos": 15
}
```