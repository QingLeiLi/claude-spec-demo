/**
 * Contract test for GET /api/albums endpoint
 * Tests the album listing API contract specification
 */

import { describe, it, expect, beforeEach } from 'vitest'

describe('GET /api/albums Contract', () => {
  let albumApi

  beforeEach(async () => {
    // This will fail until we implement the album API service
    const { AlbumAPI } = await import('../../src/services/api/album-api.js')
    albumApi = new AlbumAPI()
  })

  it('should return albums ordered by display_order', async () => {
    const response = await albumApi.getAlbums()

    // Contract specification validation
    expect(response).toHaveProperty('albums')
    expect(response).toHaveProperty('total_count')
    expect(Array.isArray(response.albums)).toBe(true)
    expect(typeof response.total_count).toBe('number')
  })

  it('should return album objects with required fields', async () => {
    const response = await albumApi.getAlbums()

    if (response.albums.length > 0) {
      const album = response.albums[0]

      // Validate album structure matches contract
      expect(album).toHaveProperty('id')
      expect(album).toHaveProperty('name')
      expect(album).toHaveProperty('date_start')
      expect(album).toHaveProperty('date_end')
      expect(album).toHaveProperty('display_order')
      expect(album).toHaveProperty('photo_count')

      // Type validation
      expect(typeof album.id).toBe('number')
      expect(typeof album.name).toBe('string')
      expect(typeof album.date_start).toBe('string')
      expect(typeof album.date_end).toBe('string')
      expect(typeof album.display_order).toBe('number')
      expect(typeof album.photo_count).toBe('number')
    }
  })

  it('should include cover_photo when album has photos', async () => {
    const response = await albumApi.getAlbums()

    const albumWithPhotos = response.albums.find(album => album.photo_count > 0)
    if (albumWithPhotos) {
      expect(albumWithPhotos).toHaveProperty('cover_photo')
      expect(albumWithPhotos.cover_photo).toHaveProperty('id')
      expect(albumWithPhotos.cover_photo).toHaveProperty('thumbnail_data')
    }
  })

  it('should return albums sorted by display_order ascending', async () => {
    const response = await albumApi.getAlbums()

    if (response.albums.length > 1) {
      for (let i = 1; i < response.albums.length; i++) {
        expect(response.albums[i].display_order).toBeGreaterThanOrEqual(
          response.albums[i - 1].display_order
        )
      }
    }
  })
})