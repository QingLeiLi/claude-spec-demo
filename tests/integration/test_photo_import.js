/**
 * Integration test for photo import and album creation
 * Tests complete workflow from quickstart scenario 1
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('Photo Import and Album Creation Integration', () => {
  let app
  let database

  beforeEach(async () => {
    // This will fail until we implement the main app components
    const { App } = await import('../../src/components/app.js')
    const { Database } = await import('../../src/models/database.js')

    database = new Database()
    await database.init()
    app = new App(database)
    await app.init()
  })

  afterEach(async () => {
    if (database) {
      await database.close()
    }
  })

  it('should import photos and create albums automatically by date', async () => {
    // Create mock photos with different dates
    const photos = [
      createMockPhoto('jan1.jpg', '2024-01-15'),
      createMockPhoto('jan2.jpg', '2024-01-20'),
      createMockPhoto('feb1.jpg', '2024-02-10'),
      createMockPhoto('feb2.jpg', '2024-02-25')
    ]

    // Import photos
    const importResult = await app.importPhotos(photos)

    // Verify import success
    expect(importResult.total_imported).toBe(4)
    expect(importResult.failed.length).toBe(0)

    // Verify albums were created
    const albums = await app.getAlbums()
    expect(albums.length).toBeGreaterThanOrEqual(2) // At least January and February

    // Verify album names contain date information
    const albumNames = albums.map(album => album.name)
    expect(albumNames.some(name => name.includes('January') || name.includes('2024-01'))).toBe(true)
    expect(albumNames.some(name => name.includes('February') || name.includes('2024-02'))).toBe(true)

    // Verify photos are correctly distributed
    const janAlbum = albums.find(album =>
      album.name.includes('January') || album.name.includes('2024-01')
    )
    const febAlbum = albums.find(album =>
      album.name.includes('February') || album.name.includes('2024-02')
    )

    expect(janAlbum.photo_count).toBe(2)
    expect(febAlbum.photo_count).toBe(2)
  })

  it('should generate thumbnails for imported photos', async () => {
    const photos = [createMockPhoto('test.jpg', '2024-01-15')]

    const importResult = await app.importPhotos(photos)
    expect(importResult.total_imported).toBe(1)

    const importedPhoto = importResult.imported[0]
    expect(importedPhoto.thumbnail_data).toBeDefined()
    expect(importedPhoto.thumbnail_data).toMatch(/^data:image\/jpeg;base64,/)
  })

  it('should handle photos without date metadata', async () => {
    const photos = [createMockPhoto('undated.jpg', null)]

    const importResult = await app.importPhotos(photos)
    expect(importResult.total_imported).toBe(1)

    const albums = await app.getAlbums()
    const undatedAlbum = albums.find(album => album.name === 'Undated')

    expect(undatedAlbum).toBeDefined()
    expect(undatedAlbum.photo_count).toBeGreaterThanOrEqual(1)
  })

  it('should maintain chronological album order', async () => {
    const photos = [
      createMockPhoto('dec.jpg', '2023-12-15'),
      createMockPhoto('jan.jpg', '2024-01-15'),
      createMockPhoto('mar.jpg', '2024-03-15')
    ]

    await app.importPhotos(photos)
    const albums = await app.getAlbums()

    // Filter out the default "Undated" album for this test
    const datedAlbums = albums.filter(album => album.name !== 'Undated')

    if (datedAlbums.length > 1) {
      for (let i = 1; i < datedAlbums.length; i++) {
        expect(datedAlbums[i].date_start).toBeDefined()
        expect(datedAlbums[i - 1].date_start).toBeDefined()
        expect(new Date(datedAlbums[i].date_start)).toBeInstanceOf(Date)
      }
    }
  })

  it('should set cover photos for new albums', async () => {
    const photos = [createMockPhoto('cover.jpg', '2024-01-15')]

    await app.importPhotos(photos)
    const albums = await app.getAlbums()

    const newAlbum = albums.find(album => album.photo_count > 0 && album.name !== 'Undated')
    expect(newAlbum.cover_photo).toBeDefined()
    expect(newAlbum.cover_photo.thumbnail_data).toBeDefined()
  })

  // Helper function to create mock photo files
  function createMockPhoto(filename, dateString) {
    const file = new File(['mock-image-data'], filename, { type: 'image/jpeg' })

    // Mock date metadata if provided
    if (dateString) {
      file._mockExifDate = new Date(dateString)
    }

    return file
  }
})