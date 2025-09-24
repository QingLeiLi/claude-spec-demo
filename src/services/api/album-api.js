/**
 * Album API service - implements contract endpoints for album operations
 * Provides the API interface expected by the contract tests
 */

import { Album } from '../../models/album.js'

export class AlbumAPI {
  constructor(database) {
    this.db = database
    this.albumModel = new Album(database)
  }

  /**
   * GET /api/albums - Retrieve all albums ordered by display_order
   * @returns {Promise<Object>} Albums response matching contract
   */
  async getAlbums() {
    try {
      const albums = await this.albumModel.findAll()

      return {
        albums: albums,
        total_count: albums.length
      }
    } catch (error) {
      throw new Error(`Failed to get albums: ${error.message}`)
    }
  }

  /**
   * GET /api/albums/{id} - Get specific album with photos
   * @param {number} id - Album ID
   * @returns {Promise<Object>} Album with photos
   */
  async getAlbum(id) {
    try {
      const album = await this.albumModel.findById(id)

      if (!album) {
        throw new Error('Album not found')
      }

      // Get photos for this album (simplified for now)
      const photos = [] // Would use PhotoAPI.getPhotosByAlbum(id)

      return {
        ...album,
        photos: photos
      }
    } catch (error) {
      throw new Error(`Failed to get album: ${error.message}`)
    }
  }

  /**
   * POST /api/albums - Create new album
   * @param {Object} albumData - Album data
   * @returns {Promise<Object>} Created album
   */
  async createAlbum(albumData) {
    try {
      return await this.albumModel.create(albumData)
    } catch (error) {
      throw new Error(`Failed to create album: ${error.message}`)
    }
  }

  /**
   * PUT /api/albums/{id}/order - Update album display order
   * @param {number} id - Album ID
   * @param {Object} orderData - Order data with new_order and moved_from
   * @returns {Promise<Object>} Reorder result
   */
  async updateAlbumOrder(id, orderData) {
    try {
      const { new_order } = orderData

      const updatedAlbums = await this.albumModel.reorder(id, new_order)

      return {
        success: true,
        updated_albums: updatedAlbums.map(album => ({
          id: album.id,
          display_order: album.display_order
        }))
      }
    } catch (error) {
      throw new Error(`Failed to update album order: ${error.message}`)
    }
  }

  /**
   * DELETE /api/albums/{id} - Delete album and all photos
   * @param {number} id - Album ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteAlbum(id) {
    try {
      // Get photo count before deletion
      const album = await this.albumModel.findById(id)
      const photoCount = album ? album.photo_count : 0

      const success = await this.albumModel.delete(id)

      return {
        success: success,
        deleted_photos: photoCount
      }
    } catch (error) {
      throw new Error(`Failed to delete album: ${error.message}`)
    }
  }
}