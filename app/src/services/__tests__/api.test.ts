import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

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
    isAxiosError: () => false,
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}))

import * as api from '../api'

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
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

  describe('fetchAllHotTopics', () => {
    it('uses the aggregate hot endpoint when it returns data', async () => {
      mockGet.mockResolvedValue({
        data: {
          data: {
            baidu: [
              {
                title: '聚合热点',
                url: 'https://example.com/hot',
                hot: 100,
                index: 1,
                desc: '来自聚合接口',
              },
            ],
            weibo: [
              {
                title: '微博聚合热点',
                url: 'https://example.com/weibo',
                hot: 200,
                index: 1,
              },
            ],
          },
          stale: true,
        },
      })

      const result = await api.fetchAllHotTopics()

      expect(mockGet).toHaveBeenCalledTimes(1)
      expect(mockGet).toHaveBeenCalledWith('/api/hot/all')
      expect(result.topics).toHaveLength(2)
      expect(result.topics[0]).toMatchObject({
        title: '聚合热点',
        source: 'baidu',
        rank: 1,
        description: '来自聚合接口',
      })
      expect(result.stale).toBe(true)
      expect(result.mock).toBe(false)
    })

    it('falls back to single-source endpoints when aggregate returns no data', async () => {
      vi.useFakeTimers()
      mockGet.mockImplementation((url: string) => {
        if (url === '/api/hot/all') {
          return Promise.resolve({ data: { data: {}, mock: true } })
        }
        if (url === '/api/weibo/hot') {
          return new Promise(() => undefined)
        }
        return Promise.resolve({
          data: {
            data: [
              {
                title: `${url} topic`,
                url: 'https://example.com',
                hot: 100,
                index: 1,
              },
            ],
          },
        })
      })

      const promise = api.fetchAllHotTopics()
      await vi.advanceTimersByTimeAsync(3500)
      const result = await promise

      expect(result.topics).toHaveLength(5)
      expect(result.topics.map((topic) => topic.source)).not.toContain('weibo')
      expect(result.mock).toBe(false)
      expect(mockGet).toHaveBeenCalledWith('/api/hot/all')
      expect(mockGet).toHaveBeenCalledWith('/api/baidu/hot')
    })
  })

  describe('searchAllImages', () => {
    it('does not let a slow image source block faster sources', async () => {
      vi.resetModules()
      const freshApi = await import('../api')
      vi.useFakeTimers()
      mockGet.mockImplementation((url: string) => {
        if (url === '/api/unsplash/search') {
          return new Promise(() => undefined)
        }
        if (url === '/api/pexels/search') {
          return Promise.resolve({
            data: {
              photos: [
                {
                  id: 'p1',
                  src: { large: '/pexels-large.jpg', medium: '/pexels-medium.jpg', original: '/pexels-original.jpg' },
                  alt: 'pexels image',
                  photographer: 'Pexels Author',
                },
              ],
              source: 'pexels',
            },
          })
        }
        return Promise.resolve({
          data: {
            hits: [
              {
                id: 'px1',
                largeImageURL: '/pixabay-large.jpg',
                previewURL: '/pixabay-preview.jpg',
                tags: 'pixabay image',
                user: 'Pixabay Author',
              },
            ],
            source: 'pixabay',
          },
        })
      })

      const promise = freshApi.searchAllImages({ query: '风景', page: 1, pageSize: 15 })
      await vi.advanceTimersByTimeAsync(4500)
      const result = await promise

      expect(result.images).toHaveLength(2)
      expect(result.sources).toEqual(['pexels', 'pixabay'])
      expect(result.images.map((image) => image.source)).toEqual(['pexels', 'pixabay'])
    })

    it('returns cached image search results for the same filter', async () => {
      vi.resetModules()
      const freshApi = await import('../api')
      mockGet.mockImplementation((url: string) => {
        if (url === '/api/unsplash/search') {
          return Promise.resolve({
            data: {
              results: [
                {
                  id: 'u1',
                  urls: { regular: '/regular.jpg', thumb: '/thumb.jpg' },
                  alt_description: 'unsplash image',
                  user: { name: 'Unsplash Author' },
                  links: { download: '/download.jpg' },
                },
              ],
              source: 'unsplash',
            },
          })
        }
        if (url === '/api/pexels/search') {
          return Promise.resolve({ data: { photos: [], source: 'pexels' } })
        }
        return Promise.resolve({ data: { hits: [], source: 'pixabay' } })
      })

      const filter = { query: '科技', page: 1, pageSize: 15 } as const
      const first = await freshApi.searchAllImages(filter)
      const second = await freshApi.searchAllImages(filter)

      expect(first).toEqual(second)
      expect(mockGet).toHaveBeenCalledTimes(3)
    })
  })

  describe('generateArticleStream', () => {
    it('rejects with a readable timeout error when the stream never responds', async () => {
      vi.useFakeTimers()
      const originalFetch = globalThis.fetch
      globalThis.fetch = vi.fn((_, init?: RequestInit) => new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('aborted', 'AbortError'))
        })
      })) as typeof fetch

      const promise = api.generateArticleStream('写一篇文章', 1000, 'key', 'model', vi.fn())
      const rejection = expect(promise).rejects.toThrow('AI 流式请求超时，请稍后重试')
      await vi.advanceTimersByTimeAsync(45000)

      await rejection
      globalThis.fetch = originalFetch
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

  describe('analyzeContent', () => {
    it('normalizes server analysis fields for the content analysis UI', async () => {
      mockPost.mockResolvedValue({
        data: {
          qualityScore: 82,
          seo: {
            score: 76,
            titleSuggestion: '更具体的标题',
            keywords: ['AI工具', '效率'],
            description: '这是一段SEO描述',
          },
          readability: {
            score: 68,
            paragraphStructure: '段落偏长',
            avgSentenceLength: '适中',
            vocabularyDiversity: '较丰富',
          },
          sentiment: {
            tendency: '积极',
            intensity: '强',
            description: '整体积极',
          },
          improvements: ['增加案例'],
        },
      })

      const result = await api.analyzeContent('标题', '<p>内容</p>', 'key', 'model', 'https://api.example.com/v1')

      expect(result.seo.suggestions).toEqual([
        '标题建议：更具体的标题',
        '推荐关键词：AI工具、效率',
        '摘要建议：这是一段SEO描述',
      ])
      expect(result.readability.details).toEqual([
        '段落结构：段落偏长',
        '句子长度：适中',
        '词汇多样性：较丰富',
      ])
      expect(result.sentiment.type).toBe('positive')
      expect(result.sentiment.score).toBe(85)
    })
  })
})
