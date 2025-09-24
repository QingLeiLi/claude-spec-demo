/**
 * Integration test for drag-and-drop album reordering
 * Tests complete workflow from quickstart scenario 2
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('Album Drag-and-Drop Reordering Integration', () => {
  let app
  let database
  let mainPage

  beforeEach(async () => {
    // This will fail until we implement the components
    const { App } = await import('../../src/components/app.js')
    const { Database } = await import('../../src/models/database.js')
    const { MainPage } = await import('../../src/components/main-page.js')

    database = new Database()
    await database.init()
    app = new App(database)
    await app.init()

    mainPage = new MainPage(app)

    // Create test albums with known order
    await createTestAlbums()
  })

  afterEach(async () => {
    if (database) {
      await database.close()
    }
  })

  it('should reorder albums when dragged to new position', async () => {
    const initialAlbums = await app.getAlbums()
    expect(initialAlbums.length).toBeGreaterThanOrEqual(3)

    // Get initial order
    const albumIds = initialAlbums.map(album => album.id)
    const firstAlbumId = albumIds[0]
    const lastPosition = albumIds.length

    // Simulate drag-and-drop: move first album to last position
    await mainPage.reorderAlbum(firstAlbumId, 1, lastPosition)

    // Verify new order
    const reorderedAlbums = await app.getAlbums()
    const newOrder = reorderedAlbums.map(album => album.id)

    // First album should now be at the end
    expect(newOrder[newOrder.length - 1]).toBe(firstAlbumId)

    // Other albums should have shifted
    expect(newOrder).not.toEqual(albumIds)
  })

  it('should persist album order changes immediately', async () => {
    const albums = await app.getAlbums()
    const targetAlbum = albums[0]
    const newPosition = albums.length

    // Perform reorder
    await mainPage.reorderAlbum(targetAlbum.id, 1, newPosition)

    // Create new app instance to verify persistence
    const newApp = new App(database)
    await newApp.init()

    const persistedAlbums = await newApp.getAlbums()
    const persistedOrder = persistedAlbums.map(album => album.id)

    // Original first album should be at the end
    expect(persistedOrder[persistedOrder.length - 1]).toBe(targetAlbum.id)
  })

  it('should update display_order values correctly', async () => {
    const albums = await app.getAlbums()
    const secondAlbum = albums[1]

    // Move second album to first position
    await mainPage.reorderAlbum(secondAlbum.id, 2, 1)

    const reorderedAlbums = await app.getAlbums()

    // Verify display_order values are sequential
    for (let i = 0; i < reorderedAlbums.length; i++) {
      expect(reorderedAlbums[i].display_order).toBe(i + 1)
    }

    // Verify the moved album is now first
    expect(reorderedAlbums[0].id).toBe(secondAlbum.id)
    expect(reorderedAlbums[0].display_order).toBe(1)
  })

  it('should handle edge case reordering correctly', async () => {
    const albums = await app.getAlbums()

    if (albums.length >= 2) {
      const lastAlbum = albums[albums.length - 1]
      const lastPosition = albums.length

      // Try to move last album to last position (no-op)
      await mainPage.reorderAlbum(lastAlbum.id, lastPosition, lastPosition)

      const unchangedAlbums = await app.getAlbums()
      const unchangedOrder = unchangedAlbums.map(album => album.id)
      const originalOrder = albums.map(album => album.id)

      // Order should remain the same
      expect(unchangedOrder).toEqual(originalOrder)
    }
  })

  it('should provide visual feedback during drag operations', async () => {
    const albums = await app.getAlbums()
    if (albums.length === 0) return

    const albumElement = mainPage.getAlbumElement(albums[0].id)

    // Simulate drag start
    const dragStartEvent = new DragEvent('dragstart')
    albumElement.dispatchEvent(dragStartEvent)

    // Check if dragging class is added
    expect(albumElement.classList.contains('dragging')).toBe(true)

    // Simulate drag end
    const dragEndEvent = new DragEvent('dragend')
    albumElement.dispatchEvent(dragEndEvent)

    // Check if dragging class is removed
    expect(albumElement.classList.contains('dragging')).toBe(false)
  })

  it('should handle multiple rapid reorder operations', async () => {
    const albums = await app.getAlbums()
    if (albums.length < 3) return

    const firstAlbum = albums[0]
    const secondAlbum = albums[1]

    // Perform rapid reorders
    await Promise.all([
      mainPage.reorderAlbum(firstAlbum.id, 1, 3),
      mainPage.reorderAlbum(secondAlbum.id, 2, 1)
    ])

    const finalAlbums = await app.getAlbums()

    // Verify all albums still have valid display_order values
    const displayOrders = finalAlbums.map(album => album.display_order)
    const sortedOrders = [...displayOrders].sort((a, b) => a - b)

    expect(displayOrders).toEqual(sortedOrders)

    // Verify no duplicates
    const uniqueOrders = new Set(displayOrders)
    expect(uniqueOrders.size).toBe(displayOrders.length)
  })

  // Helper function to create test albums
  async function createTestAlbums() {
    const testPhotos = [
      createMockPhoto('album1.jpg', '2024-01-15'),
      createMockPhoto('album2.jpg', '2024-02-15'),
      createMockPhoto('album3.jpg', '2024-03-15'),
      createMockPhoto('album4.jpg', '2024-04-15')
    ]

    await app.importPhotos(testPhotos)
  }

  function createMockPhoto(filename, dateString) {
    const file = new File(['mock-image-data'], filename, { type: 'image/jpeg' })
    if (dateString) {
      file._mockExifDate = new Date(dateString)
    }
    return file
  }
})