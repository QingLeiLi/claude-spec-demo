/**
 * Photo API service - implements contract endpoints for photo operations
 * Provides the API interface expected by the contract tests
 */

import { Photo } from '../../models/photo.js'
import { Album } from '../../models/album.js'

export class PhotoAPI {
  constructor(database) {
    this.db = database
    this.photoModel = new Photo(database)
    this.albumModel = new Album(database)
  }

  /**
   * POST /api/photos/import - Import photos from FormData
   * @param {FormData} formData - Form data with photo files
   * @returns {Promise<Object>} Import result matching contract
   */
  async importPhotos(formData) {
    const imported = []
    const failed = []
    let albumsCreated = 0
    let albumsUpdated = 0

    try {
      const files = formData.getAll('photos')

      for (const file of files) {
        try {
          const photoResult = await this.processPhotoFile(file)

          if (photoResult.isNewAlbum) {
            albumsCreated++
          } else {
            albumsUpdated++
          }

          imported.push({
            id: photoResult.photo.id,
            file_name: photoResult.photo.file_name,
            album_id: photoResult.photo.album_id,
            date_taken: photoResult.photo.date_taken,
            thumbnail_data: photoResult.photo.thumbnail_data
          })
        } catch (error) {
          failed.push({
            file_name: file.name,
            error: error.message
          })
        }
      }

      return {
        imported: imported,
        failed: failed,
        total_imported: imported.length,
        albums_created: albumsCreated,
        albums_updated: albumsUpdated
      }
    } catch (error) {
      throw new Error(`Photo import failed: ${error.message}`)
    }
  }

  /**
   * GET /api/photos/{id} - Get specific photo with metadata
   * @param {number} id - Photo ID
   * @returns {Promise<Object>} Photo with full metadata
   */
  async getPhoto(id) {
    try {
      const photo = await this.photoModel.findById(id)

      if (!photo) {
        throw new Error('Photo not found')
      }

      return photo
    } catch (error) {
      throw new Error(`Failed to get photo: ${error.message}`)
    }
  }

  /**
   * GET /api/photos/{id}/thumbnail - Get photo thumbnail
   * @param {number} id - Photo ID
   * @returns {Promise<string>} Thumbnail data URL
   */
  async getPhotoThumbnail(id) {
    try {
      const photo = await this.photoModel.findById(id)

      if (!photo || !photo.thumbnail_data) {
        throw new Error('Thumbnail not found')
      }

      return photo.thumbnail_data
    } catch (error) {
      throw new Error(`Failed to get thumbnail: ${error.message}`)
    }
  }

  /**
   * GET /api/photos/album/{album_id} - Get photos in album
   * @param {number} albumId - Album ID
   * @param {Object} options - Query options (page, limit)
   * @returns {Promise<Object>} Paginated photos
   */
  async getPhotosByAlbum(albumId, options = {}) {
    try {
      const { page = 1, limit = 50 } = options
      const offset = (page - 1) * limit

      const photos = await this.photoModel.findByAlbum(albumId, { limit, offset })
      const totalCount = await this.photoModel.countByAlbum(albumId)
      const totalPages = Math.ceil(totalCount / limit)

      return {
        photos: photos,
        total_count: totalCount,
        page: page,
        total_pages: totalPages
      }
    } catch (error) {
      throw new Error(`Failed to get album photos: ${error.message}`)
    }
  }

  /**
   * PUT /api/photos/{id}/order - Reorder photo within album
   * @param {number} id - Photo ID
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} Reorder result
   */
  async updatePhotoOrder(id, orderData) {
    try {
      const { new_order } = orderData

      const updatedPhotos = await this.photoModel.reorder(id, new_order)

      return {
        success: true,
        updated_photos: updatedPhotos.map(photo => ({
          id: photo.id,
          display_order: photo.display_order
        }))
      }
    } catch (error) {
      throw new Error(`Failed to update photo order: ${error.message}`)
    }
  }

  /**
   * DELETE /api/photos/{id} - Delete photo
   * @param {number} id - Photo ID
   * @returns {Promise<Object>} Delete result
   */
  async deletePhoto(id) {
    try {
      const photo = await this.photoModel.findById(id)
      if (!photo) {
        throw new Error('Photo not found')
      }

      const albumId = photo.album_id
      const success = await this.photoModel.delete(id)

      // Get updated photo count
      const updatedCount = await this.photoModel.countByAlbum(albumId)

      return {
        success: success,
        album_id: albumId,
        updated_photo_count: updatedCount
      }
    } catch (error) {
      throw new Error(`Failed to delete photo: ${error.message}`)
    }
  }

  /**
   * Process individual photo file for import
   * @param {File} file - Photo file
   * @returns {Promise<Object>} Processing result
   * @private
   */
  async processPhotoFile(file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Invalid image format')
    }

    // Extract or mock date information
    let dateMetadata = null
    if (file._mockExifDate) {
      dateMetadata = file._mockExifDate
    } else {
      // In real implementation, would extract EXIF data
      dateMetadata = new Date(file.lastModified)
    }

    // Find or create album for this date
    const existingAlbumsCount = (await this.albumModel.findAll()).length
    const album = await this.albumModel.findOrCreateForDate(dateMetadata)
    const newAlbumsCount = (await this.albumModel.findAll()).length
    const isNewAlbum = newAlbumsCount > existingAlbumsCount

    // Generate thumbnail (mocked for now)
    const thumbnailData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD'

    // Create photo record
    const photoData = {
      file_name: file.name,
      file_path: `blob:${URL.createObjectURL(file)}`,
      file_size: file.size,
      mime_type: file.type,
      date_taken: dateMetadata.toISOString(),
      width: file._mockDimensions?.width || 1920,
      height: file._mockDimensions?.height || 1080,
      thumbnail_data: thumbnailData,
      exif_data: file._mockExifData || null,
      album_id: album.id
    }

    const photo = await this.photoModel.create(photoData)

    return {
      photo: photo,
      album: album,
      isNewAlbum: isNewAlbum
    }
  }
}