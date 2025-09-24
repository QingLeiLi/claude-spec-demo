/**
 * Contract test for POST /api/photos/import endpoint
 * Tests the photo import API contract specification
 */

import { describe, it, expect, beforeEach } from 'vitest'

describe('POST /api/photos/import Contract', () => {
  let photoApi

  beforeEach(async () => {
    // This will fail until we implement the photo API service
    const { PhotoAPI } = await import('../../src/services/api/photo-api.js')
    photoApi = new PhotoAPI()
  })

  it('should import photos and return structured response', async () => {
    // Mock FormData with photo files
    const mockFiles = [
      new File(['fake-image-data'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['fake-image-data'], 'test2.jpg', { type: 'image/jpeg' })
    ]

    const formData = new FormData()
    mockFiles.forEach(file => formData.append('photos', file))

    const response = await photoApi.importPhotos(formData)

    // Contract specification validation
    expect(response).toHaveProperty('imported')
    expect(response).toHaveProperty('failed')
    expect(response).toHaveProperty('total_imported')
    expect(response).toHaveProperty('albums_created')
    expect(response).toHaveProperty('albums_updated')

    expect(Array.isArray(response.imported)).toBe(true)
    expect(Array.isArray(response.failed)).toBe(true)
    expect(typeof response.total_imported).toBe('number')
    expect(typeof response.albums_created).toBe('number')
    expect(typeof response.albums_updated).toBe('number')
  })

  it('should return imported photo objects with required fields', async () => {
    const mockFiles = [
      new File(['fake-image-data'], 'test.jpg', { type: 'image/jpeg' })
    ]

    const formData = new FormData()
    formData.append('photos', mockFiles[0])

    const response = await photoApi.importPhotos(formData)

    if (response.imported.length > 0) {
      const photo = response.imported[0]

      // Validate photo structure matches contract
      expect(photo).toHaveProperty('id')
      expect(photo).toHaveProperty('file_name')
      expect(photo).toHaveProperty('album_id')
      expect(photo).toHaveProperty('date_taken')
      expect(photo).toHaveProperty('thumbnail_data')

      // Type validation
      expect(typeof photo.id).toBe('number')
      expect(typeof photo.file_name).toBe('string')
      expect(typeof photo.album_id).toBe('number')
    }
  })

  it('should handle import failures gracefully', async () => {
    const mockFiles = [
      new File(['invalid-data'], 'corrupt.txt', { type: 'text/plain' })
    ]

    const formData = new FormData()
    formData.append('photos', mockFiles[0])

    const response = await photoApi.importPhotos(formData)

    // Should not throw error, but report failed imports
    expect(response.failed.length).toBeGreaterThan(0)
    expect(response.failed[0]).toHaveProperty('file_name')
    expect(response.failed[0]).toHaveProperty('error')
  })

  it('should update counters correctly', async () => {
    const mockFiles = [
      new File(['fake-image-data'], 'test.jpg', { type: 'image/jpeg' })
    ]

    const formData = new FormData()
    formData.append('photos', mockFiles[0])

    const response = await photoApi.importPhotos(formData)

    // Total imported should match successful imports
    expect(response.total_imported).toBe(response.imported.length)

    // Albums created or updated count should be non-negative
    expect(response.albums_created).toBeGreaterThanOrEqual(0)
    expect(response.albums_updated).toBeGreaterThanOrEqual(0)
  })
})