/**
 * Integration test for large photo collections performance
 * Tests performance requirements from quickstart scenario
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('Large Photo Collections Performance', () => {
  let app
  let database

  beforeEach(async () => {
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

  it('should handle album switching under 200ms', async () => {
    // Create albums with photos
    await createLargePhotoCollection(50)

    const albums = await app.getAlbums()
    const targetAlbum = albums.find(album => album.photo_count > 10)

    if (targetAlbum) {
      const startTime = performance.now()
      await app.openAlbum(targetAlbum.id)
      const endTime = performance.now()

      const switchTime = endTime - startTime
      expect(switchTime).toBeLessThan(200) // Constitutional requirement: <200ms
    }
  })

  it('should load thumbnails within 500ms for 20 photos', async () => {
    await createLargePhotoCollection(25)

    const albums = await app.getAlbums()
    const targetAlbum = albums.find(album => album.photo_count >= 20)

    if (targetAlbum) {
      const startTime = performance.now()
      const photos = await app.getAlbumPhotos(targetAlbum.id, { limit: 20 })
      const endTime = performance.now()

      const loadTime = endTime - startTime
      expect(loadTime).toBeLessThan(500) // Performance target from quickstart
      expect(photos.length).toBe(20)

      // Verify thumbnails are loaded
      photos.forEach(photo => {
        expect(photo.thumbnail_data).toBeDefined()
      })
    }
  })

  it('should import photos under 1 second per photo', async () => {
    const testPhotos = Array.from({ length: 10 }, (_, i) =>
      createMockPhoto(`test${i}.jpg`, `2024-01-${String(i + 1).padStart(2, '0')}`)
    )

    const startTime = performance.now()
    const result = await app.importPhotos(testPhotos)
    const endTime = performance.now()

    const totalTime = endTime - startTime
    const timePerPhoto = totalTime / result.total_imported

    expect(timePerPhoto).toBeLessThan(1000) // <1 second per photo
    expect(result.total_imported).toBe(10)
  })

  it('should maintain responsive UI during large operations', async () => {
    // Test that UI remains responsive during bulk operations
    const photos = Array.from({ length: 100 }, (_, i) =>
      createMockPhoto(`bulk${i}.jpg`, `2024-${String(Math.floor(i / 10) + 1).padStart(2, '0')}-01`)
    )

    let uiResponsive = true
    const responseCheck = setInterval(() => {
      const checkStart = performance.now()
      // Simulate UI operation
      setTimeout(() => {
        const checkEnd = performance.now()
        if (checkEnd - checkStart > 100) {
          uiResponsive = false
        }
      }, 0)
    }, 50)

    await app.importPhotos(photos)
    clearInterval(responseCheck)

    expect(uiResponsive).toBe(true)
  })

  it('should handle database queries under 50ms', async () => {
    await createLargePhotoCollection(100)

    const queryTests = [
      () => app.getAlbums(),
      () => app.getAlbumPhotos(1, { limit: 20 }),
      () => app.searchPhotos({ dateRange: { start: '2024-01-01', end: '2024-12-31' } })
    ]

    for (const queryTest of queryTests) {
      const startTime = performance.now()
      await queryTest()
      const endTime = performance.now()

      const queryTime = endTime - startTime
      expect(queryTime).toBeLessThan(50) // Database query performance target
    }
  })

  it('should use virtual scrolling for large photo collections', async () => {
    await createLargePhotoCollection(200)

    const albums = await app.getAlbums()
    const largeAlbum = albums.find(album => album.photo_count > 100)

    if (largeAlbum) {
      const albumView = await app.openAlbum(largeAlbum.id)

      // Check that virtual scrolling is enabled
      expect(albumView.virtualScrolling).toBe(true)

      // Verify only visible photos are rendered initially
      const renderedPhotos = albumView.getRenderedPhotos()
      expect(renderedPhotos.length).toBeLessThan(largeAlbum.photo_count)
      expect(renderedPhotos.length).toBeGreaterThan(0)
    }
  })

  it('should limit memory usage during thumbnail generation', async () => {
    const initialMemory = performance.memory?.usedJSHeapSize || 0

    // Import photos that would generate many thumbnails
    const photos = Array.from({ length: 50 }, (_, i) =>
      createLargePhoto(`memory_test${i}.jpg`, 1920, 1080)
    )

    await app.importPhotos(photos)

    const finalMemory = performance.memory?.usedJSHeapSize || 0
    const memoryIncrease = finalMemory - initialMemory

    // Memory increase should be reasonable (less than 100MB for 50 photos)
    if (initialMemory > 0) {
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024)
    }
  })

  // Helper functions
  async function createLargePhotoCollection(count) {
    const photos = Array.from({ length: count }, (_, i) => {
      const month = Math.floor(i / 10) + 1
      const day = (i % 10) + 1
      return createMockPhoto(
        `photo${i}.jpg`,
        `2024-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      )
    })

    await app.importPhotos(photos)
  }

  function createMockPhoto(filename, dateString) {
    const file = new File(['mock-image-data'], filename, { type: 'image/jpeg' })
    if (dateString) {
      file._mockExifDate = new Date(dateString)
    }
    return file
  }

  function createLargePhoto(filename, width, height) {
    // Create larger mock data to simulate real photo sizes
    const largeData = new Array(1000).fill('x').join('')
    const file = new File([largeData], filename, { type: 'image/jpeg' })
    file._mockDimensions = { width, height }
    return file
  }
})