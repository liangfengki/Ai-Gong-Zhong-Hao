import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGet, mockPost, mockPut, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPut: vi.fn(),
  mockDelete: vi.fn(),
}))

vi.mock('axios', () => ({
  default: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    delete: mockDelete,
  },
}))

import * as api from '../api'

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchDocumentList', () => {
    it('returns document list', async () => {
      const mockData = [
        { id: '1', title: 'Doc 1', updatedAt: '2024-01-01T00:00:00Z' },
        { id: '2', title: 'Doc 2', updatedAt: '2024-01-02T00:00:00Z' },
      ]
      mockGet.mockResolvedValue({ data: mockData })

      const result = await api.fetchDocumentList()

      expect(mockGet).toHaveBeenCalledWith('/api/documents')
      expect(result).toEqual(mockData)
    })
  })

  describe('fetchDocument', () => {
    it('returns document by id', async () => {
      const mockDoc = {
        id: '1',
        title: 'Test',
        content: 'Hello',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }
      mockGet.mockResolvedValue({ data: mockDoc })

      const result = await api.fetchDocument('1')

      expect(mockGet).toHaveBeenCalledWith('/api/documents/1')
      expect(result).toEqual(mockDoc)
    })
  })

  describe('createDocument', () => {
    it('creates a new document', async () => {
      const req = { title: 'New Doc', content: 'Content' }
      const mockDoc = { id: '3', ...req, createdAt: '2024-01-03T00:00:00Z', updatedAt: '2024-01-03T00:00:00Z' }
      mockPost.mockResolvedValue({ data: mockDoc })

      const result = await api.createDocument(req)

      expect(mockPost).toHaveBeenCalledWith('/api/documents', req)
      expect(result).toEqual(mockDoc)
    })
  })

  describe('updateDocument', () => {
    it('updates existing document', async () => {
      const req = { id: '1', title: 'Updated' }
      const mockDoc = { id: '1', title: 'Updated', content: 'Hello', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-03T00:00:00Z' }
      mockPut.mockResolvedValue({ data: mockDoc })

      const result = await api.updateDocument(req)

      expect(mockPut).toHaveBeenCalledWith('/api/documents/1', req)
      expect(result).toEqual(mockDoc)
    })
  })

  describe('deleteDocument', () => {
    it('deletes document by id', async () => {
      mockDelete.mockResolvedValue({})

      await api.deleteDocument('1')

      expect(mockDelete).toHaveBeenCalledWith('/api/documents/1')
    })
  })
})
