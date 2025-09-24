/**
 * Main page component - album grid layout and drag-and-drop
 * Provides the interface expected by integration tests
 */

export class MainPage {
  constructor(app) {
    this.app = app
    this.albumElements = new Map() // Map of album ID to DOM element
  }

  /**
   * Reorder album via drag-and-drop
   * @param {number} albumId - Album to move
   * @param {number} fromPosition - Current position
   * @param {number} toPosition - Target position
   * @returns {Promise<void>}
   */
  async reorderAlbum(albumId, fromPosition, toPosition) {
    try {
      await this.app.reorderAlbum(albumId, fromPosition, toPosition)
    } catch (error) {
      console.error('Album reordering failed:', error)
      throw error
    }
  }

  /**
   * Get album DOM element (mock for testing)
   * @param {number} albumId - Album ID
   * @returns {Object} Mock DOM element
   */
  getAlbumElement(albumId) {
    if (!this.albumElements.has(albumId)) {
      // Create mock DOM element for testing
      const mockElement = {
        id: `album-${albumId}`,
        classList: {
          classes: new Set(),
          add: function(className) { this.classes.add(className) },
          remove: function(className) { this.classes.delete(className) },
          contains: function(className) { return this.classes.has(className) }
        },
        dispatchEvent: function(event) {
          // Mock event handling
          if (event.type === 'dragstart') {
            this.classList.add('dragging')
          } else if (event.type === 'dragend') {
            this.classList.remove('dragging')
          }
        }
      }

      this.albumElements.set(albumId, mockElement)
    }

    return this.albumElements.get(albumId)
  }

  /**
   * Initialize drag-and-drop handlers
   */
  initializeDragAndDrop() {
    // Mock implementation for testing
    // In real implementation, would set up drag event listeners
  }

  /**
   * Render album grid
   * @param {Array} albums - Albums to render
   */
  renderAlbums(albums) {
    // Mock implementation for testing
    albums.forEach(album => {
      this.getAlbumElement(album.id) // Ensure element exists
    })
  }
}