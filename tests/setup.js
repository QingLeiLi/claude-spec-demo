/**
 * Test setup configuration for Vitest
 * Configures global test environment and mocks
 */

import { vi } from 'vitest'

// Mock IndexedDB for testing
global.indexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
}

// Mock File API
global.File = class File {
  constructor(chunks, filename, options = {}) {
    this.chunks = chunks
    this.name = filename
    this.type = options.type || ''
    this.size = chunks.reduce((size, chunk) => size + chunk.length, 0)
    this.lastModified = Date.now()
  }
}

global.FileReader = class FileReader {
  constructor() {
    this.readyState = 0
    this.result = null
    this.error = null
    this.onload = null
    this.onerror = null
  }

  readAsArrayBuffer() {
    setTimeout(() => {
      this.readyState = 2
      this.result = new ArrayBuffer(0)
      if (this.onload) this.onload()
    }, 0)
  }

  readAsDataURL() {
    setTimeout(() => {
      this.readyState = 2
      this.result = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD'
      if (this.onload) this.onload()
    }, 0)
  }
}

// Mock Canvas API
global.HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  drawImage: vi.fn(),
  getImageData: vi.fn(),
  putImageData: vi.fn(),
  canvas: { width: 100, height: 100 },
}))

global.HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
  callback(new Blob(['fake-image-data'], { type: 'image/jpeg' }))
})

// Suppress console warnings in tests
global.console.warn = vi.fn()